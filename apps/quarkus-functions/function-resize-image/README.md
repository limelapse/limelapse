# Image Resizing Function

## Overview
This is a Quarkus-based serverless function that processes images by creating multiple resized versions. It can be triggered either by an upload event (event-driven) or manually through an API endpoint.

## Setup

### 1. Configure MinIO for testing

Start a local MinIO server:

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

Create a bucket called "images" using the MinIO console (http://localhost:9001) or CLI.

### 2. Set MinIO client for testing

Use the following code for testing (instead of injecting the MinIO client):

```
var client = MinioClient.builder()
    .endpoint("http://localhost:9000")
    .credentials("minioadmin", "minioadmin")
    .build()
```

## Functions

The service provides two main functions:

1. **Event-driven processing** (`on-upload-event`): Automatically triggered when new images are uploaded to MinIO (not relevant for testing)
2. **Manual processing** (`resize`): Allows direct invocation via API to resize a specific image

## Image Resolutions

The function creates three resized versions of each image:

| Resolution | Width | Height | Tag    |
|------------|-------|--------|--------|
| MEDIUM     | 1920  | 1080   | medium |
| SMALL      | 1280  | 720    | small  |
| TINY       | 854   | 480    | tiny   |

## Testing

### 1. Start the Application

```bash
./gradlew quarkusDev
```

### 2. Upload a Test Image

Upload an image to MinIO using the web console or the MinIO Client (mc):

```bash
# Install mc (MinIO Client) if you haven't already
# Then configure and use it:
mc alias set local http://localhost:9000 minioadmin minioadmin
mc cp your-test-image.jpg local/images/your-image-name
```

### 3. Test the Manual Resize Function

You can test the function using curl:

```bash
curl -X POST http://localhost:8080/resize \
  -H "Content-Type: application/json" \
  -d '"your-image-name"'
```

Or using the Quarkus Funqy testing UI at http://localhost:8080/q/funqy-knative-events/

### 4. Verify Results

Check the MinIO bucket for the resized versions of your image. You should see:

- Original image: `your-image-name`
- Medium version: `your-image-name:resolution:medium`
- Small version: `your-image-name:resolution:small`
- Tiny version: `your-image-name:resolution:tiny`

## Response Format

When using the manual resize function, you'll receive a JSON response with the paths to all versions:

```json
{
  "original": "your-image-name",
  "medium": "your-image-name:resolution:medium",
  "small": "your-image-name:resolution:small",
  "tiny": "your-image-name:resolution:tiny"
}
```

## Customizing Resolutions

You can customize the resolutions by modifying the `ImageResolution` enum in the `ImageProcessingFunction.kt` file:

```kotlin
enum class ImageResolution(val width: Int, val height: Int, val tag: String) {
    MEDIUM(1920, 1080, "medium"),
    SMALL(1280, 720, "small"),
    TINY(854, 480, "tiny");
    
    // Add new resolutions here if needed
    // THUMBNAIL(320, 240, "thumbnail"),
    
    companion object {
        fun fromTag(tag: String): ImageResolution? = 
            values().find { it.tag == tag.lowercase() }
    }
}
```

## Error Handling

The function includes error handling for failed image processing operations. If an error occurs, an empty map will be returned and the error will be logged.