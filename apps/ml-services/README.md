# Machine Learning (ML) Services

## Services
### Embedding Service

#### Build

```bash
docker build --build-arg SERVICE_TYPE=embedding -t embedding-service .
```

#### Run 

```bash
docker run -p 5000:5000 embedding-service:latest
```

#### Test

**Image Embeddings (File Upload)**:

```bash
curl -X POST http://localhost:5000/image -F image=@test/images/01_tree.jpg
```

**Image Embeddings (URL)**:

```bash
curl -X POST http://localhost:5000/image -F url="https://picsum.photos/id/237/200/300"
```

**Text Embeddings**:
```bash
curl -X POST http://localhost:5000/text \
     -H "Content-Type: application/json" \
    -d '{"text": "Tree"}'
```


### Blurring Service

#### Build

```bash
docker build --build-arg SERVICE_TYPE=blurring -t blurring-service .
```

#### Run 

```bash
docker run -p 5000:5000 blurring-service:latest
```

#### Test

**Image Blurring (File Upload)**:

```bash
curl -X POST http://localhost:5000/faces -F image=@test/images/02_faces_single.jpg --output /tmp/output.jpg
```

**Image Blurring (URL)**:

```bash
curl -X POST http://localhost:5000/faces -F url="https://example.com/images/faces.jpg" --output /tmp/output.jpg
```

**Image Blurring with Upload (File Upload)**:

```bash
curl -X POST http://localhost:5000/faces \
  -F image=@test/images/02_faces_single.jpg \
  -F upload_url="https://minio.example.com/my-bucket/blurred-faces.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
```

**Image Blurring with Upload (URL)**:

```bash
curl -X POST http://localhost:5000/faces \
  -F url="https://example.com/images/faces.jpg" \
  -F upload_url="https://minio.example.com/my-bucket/blurred-faces.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
```

**Full Image Blurring (File Upload)**:

```bash
curl -X POST http://localhost:5000/full -F image=@test/images/01_tree.jpg --output /tmp/blurred.jpg
```

**Full Image Blurring (URL)**:

```bash
curl -X POST http://localhost:5000/full -F url="https://picsum.photos/id/237/200/300" --output /tmp/blurred.jpg
```

**Full Image Blurring with Upload (File Upload)**:

```bash
curl -X POST http://localhost:5000/full \
  -F image=@test/images/01_tree.jpg \
  -F upload_url="https://minio.example.com/my-bucket/blurred-image.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
```

**Full Image Blurring with Upload (URL)**:

```bash
curl -X POST http://localhost:5000/full \
  -F url="https://picsum.photos/id/237/200/300" \
  -F upload_url="https://minio.example.com/my-bucket/blurred-image.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
```

## Input Options

All image-related endpoints support two methods of providing an image:

1. **File Upload**: Upload an image file directly by specifying the `-F image=@path/to/local/file.jpg` parameter
2. **URL**: Provide a URL to the image by specifying the `-F url="https://example.com/path/to/image.jpg"` parameter

## Output Options

The blurring service endpoints support two methods of receiving the processed image:

1. **Direct Download**: By default, the processed image is returned directly in the response
2. **Upload to URL**: Provide a pre-signed upload URL by specifying the `-F upload_url="https://your-storage-url"` parameter. The processed image will be uploaded to this URL, and a JSON response with success information will be returned.

## Error Handling

The services provide detailed error responses in JSON format:

- Invalid input parameters: 400 Bad Request
- Image download failures: 422 Unprocessable Entity
- Image upload failures: 422 Unprocessable Entity
- Unexpected errors: 500 Internal Server Error

Example error response for download failure:

```json
{
  "error": "Image download failed",
  "details": "Failed to download image from https://example.com/missing.jpg. Status code: 404",
  "url": "https://example.com/missing.jpg",
  "status_code": 404
}
```

## Notes

- You must provide either a file or a URL as input, but not both. If both are provided, the API will return an error.
- For the blurring service, the `upload_url` parameter is optional. If not provided, the processed image will be returned directly.
- The embedding service returns vector embeddings in JSON format with dimension information.
- All image processing is done on the server side, with no client-side processing required.
- Pre-signed URLs for upload should be generated separately and must have appropriate permissions.

## Image Loading Service

The services use a common `ImageLoadingService` that handles downloading images from URLs and uploading processed images. This service properly handles HTTP status codes and provides detailed error information when operations fail.