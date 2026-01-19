FROM python:3.10.17-alpine3.21

RUN apk update && \
    apk add ffmpeg && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "--worker-class", "uvicorn.workers.UvicornWorker", "app:asgi_app", "--bind", "0.0.0.0:5000"]
