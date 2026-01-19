import os
import io
import asyncio
from flask import Flask, abort, request, Response
from minio import Minio
from minio.error import S3Error
import tempfile
import logging
from asgiref.wsgi import WsgiToAsgi


app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
asgi_app = WsgiToAsgi(app)

MINIO_ENDPOINT = os.environ.get("MINIO_ENDPOINT", "minio:9000")
ACCESS_KEY = os.environ.get("ACCESS_KEY", "minioadmin")
SECRET_KEY = os.environ.get("SECRET_KEY", "minioadmin")
client = Minio(MINIO_ENDPOINT, ACCESS_KEY, SECRET_KEY, secure=False)


@app.post("/process/async")
async def process_async():
    """
     Query parameters:
     - input_bucket: contains the images to be processed
     - output_bucket: the bucket into which the timelapse is output
     - timelapse_name
     Body: each line contains an object id in the input_bucket
    """
    app.logger.info("Got async processing request")
    input_bucket = request.args.get("input_bucket")
    output_bucket = request.args.get("output_bucket")
    timelapse_name = request.args.get("timelapse_name")
    if input_bucket is None or output_bucket is None or timelapse_name is None or request.stream is None:
        abort(400)
    if not client.bucket_exists(input_bucket) or not client.bucket_exists(output_bucket):
        abort(404, "Bucket not found.")

    images = [line for line in request.stream]
    image_keys = [line.decode('utf-8').strip() for line in images if line.strip()]

    with tempfile.NamedTemporaryFile(suffix=".mp4") as temp_file:
        await generate(temp_file=temp_file, input_bucket=input_bucket, images=image_keys)
        # upload timelapse
        client.put_object(output_bucket, timelapse_name, temp_file, -1, content_type="video/mp4",
                          part_size=5 * 1024 * 1024)  # min 5 MiB part_size
        return Response(status=200)


@app.post("/process/sync")
async def process_sync():
    """
     Query parameters:
     - input_bucket: contains the images to be processed
     - duration: the desired output duration
     Body: each line contains an object id in the input_bucket
    """
    app.logger.info("Got sync processing request")
    input_bucket = request.args.get("input_bucket")
    duration = request.args.get("duration")
    if input_bucket is None or duration is None or request.stream is None:
        abort(400)
    if not client.bucket_exists(input_bucket):
        abort(404, "Bucket not found.")

    try:
        duration_ms = int(duration)
    except ValueError:
        abort(400, "Duration must be a number.")

    images = [line for line in request.stream]
    image_keys = [line.decode('utf-8').strip() for line in images if line.strip()]
    num_images = len(image_keys)

    if num_images == 0:
        abort(400, "No images provided.")

    fps = num_images / (duration_ms / 1000.0)
    with tempfile.NamedTemporaryFile(suffix=".mp4") as temp_file:
        await generate(temp_file=temp_file, input_bucket=input_bucket, images=image_keys, framerate=fps)
        # upload timelapse
        return Response(
            temp_file.read(),
            content_type="video/mp4",
            headers={"Content-Disposition": "attachment; filename=preview.mp4"}
        )


async def generate(temp_file, input_bucket, images, framerate=25.0):
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-y",  # overwrite temp
        "-loglevel", "error",  # only emit errors on stderr
        "-f", "image2pipe",  # stdin has images
        "-framerate", str(framerate),
        "-i", "pipe:0",  # pipe to stdin
        "-c:v", "libx264",  # video codec
        "-pix_fmt", "yuv420p",  # pixel format
        temp_file.name,
        # cannot pipe mp4 to stdout "-f", "mp4", "pipe:1", # mp4 to stdout
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    tasks = [
        asyncio.create_task(write_stdin(proc.stdin, input_bucket, images)),
        asyncio.create_task(handle_stderr(proc.stderr)),
        asyncio.create_task(asyncio.wait_for(proc.wait(), timeout=300))
        # 5min (300 sec) timeout as per non-functional requirements
    ]
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_EXCEPTION)
    for task in done:
        exception = task.exception()
        if exception is not None:
            proc.terminate()
            for task in pending:
                await task
            if isinstance(exception, KeyError):
                abort(404, "Object in bucket not found.")
            app.logger.error("An exception occured in an asynchronous task.", exception)
            abort(500)
    errors = tasks[2].result()
    if not errors and errors != 0:
        app.logger.exception("FFmpeg has thrown errors:\n%s", errors)
        abort(500)


async def write_stdin(stdin, input_bucket, images):
    try:
        for image in images:
            response = None
            try:
                response = client.get_object(input_bucket, image)
                # pipe data into stdin
                await stdin.drain()  # wait until pipe is ready to receive
                stdin.write(response.data)  # response is consumed into data by default
            except S3Error as err:
                app.logger.exception("The Minio client has thrown an exception.")
                raise KeyError  # raise key error when cannot retrieve object from existing bucket
            finally:
                if response:
                    response.close()
                    response.release_conn()
    finally:
        stdin.close()
        await stdin.wait_closed()


async def handle_stderr(stderr):
    buffer = bytearray()
    while not stderr.at_eof():
        chunk = await stderr.read(io.DEFAULT_BUFFER_SIZE)
        if not chunk:
            continue
        buffer.extend(chunk)
    return bytes(buffer)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
