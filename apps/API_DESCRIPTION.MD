# HTTP API Description of the Limelapse-Platform

This document contains all endpoints and example payloads for the Limelapse-Platform. We refrain from using an
open-api-spec is open-api is intended for a single-server and thus is not suitable for a FAAS-architecture.

Every endpoint is protected with bearer auth. The client needs to obtain auth token from our identity
provider https://sso.limelapse.com. Parts of the client are externalized to S3 where the S3 protocol has to be used.
LimeLapse SSO tokens can be converted to S3 STS credentials via the *File Access* endpoint.

## File Upload

**Use-Case**: The mobile app uploads a previously taken picture.

**Parameters**:

- projectId: UUID of the project that receives the image

**Request**:

```
POST https://upload.limelapse.com

{
    "projectId": "<uuid>"
}
```
Optionally, you can specify a 48-bit unix epoch millis timestamp.
```
POST https://upload.limelapse.com

{
    "projectId": "<uuid>",
    "timestamp": 1747737501882
}
```

**Result**:

```
200 OK 
{
    "uploadUrl": "https://...."
}
```

The uploadUrl is a Minio presigned-url for http file-upload.

## File Download

**Use-Case**: The management app downloads pictures for timelapse editing.

**This endpoint uses the STS credentials from *File Access* to
communicate with minio.limelapse.com via the S3 protocol**

We now intend to use URNs to identify the resolution in a way similar to

`urn:uuid:<<uuid>>:resolution:<<res>>`

resolution has the values small, medium, original.

## File access

*minio access is handled this way*

If not project is supplied, the token is valid for all project of the user.

**Use-Case**: Download many pictures of a project without presigned-urls

**Parameters**:

- projectId: UUID of the project you request file-access for. (optional)

**Request**:

```
POST https://files.limelapse.com/<projectId>
```

**Response**:

```
200 OK 
{
    "accessKeyId": "aBxaswzweII...",
    "secretAccessKey": "alskjdasjklsd...",
    "sessionToken": "oijisgois...",
    "expiration": "2025-05-07T19:08:00Z+01:00"
}
```

The `accessKeyId`, `secretAccessKey`, `sessionToken` can be used with an S3 compatible client to list the contents of a
project and download and upload images to a project of a user.

## Create project

**Use-Case**: As user of the management app, I would like to create projects

**Request**:

```
POST https://projects.limelapse.com/create

{
    "name": "Renovierung Keller",
    "timeframe": "2024-2026",
    "description": "Ausbau des Kellers mit Bar, Sportraum und Sauna"
}

```

**Result**:

```
200 OK 
{
    "projectId": "8ce2144a-5d48-4854-b85d-f2d85138539b"
}
```

## Update project

**Use-Case**: As user of the management app, I would like to edit projects

**Request**:

```
POST https://projects.limelapse.com/update

{
    "projectId": "<uuid>"
    "name": "Renovierung Keller",
    "timeframe": "2024-2026",
    "description": "Ausbau des Kellers mit Bar, Sportraum und Sauna"
}

```

**Result**:

```
200 OK 
```

## List projects

**Use-Case**: As user of the management app, I would like to see my projects

**Request**:

```
GET https://projects.limelapse.com
```

**Result**:

```
200 OK 
[
    {
        "projectId": "8ce2144a-5d48-4854-b85d-f2d85138539b",
        "projectName": "Renovierung Keller",
        "timeframe": "2024-2026",
        "description": "Sportraun, Bar, Sauna"
        "client": {
            "batteryLevel": 0.55,
            "connectionQuality": 0.75
        }
    }, 
    {
        "projectId": "45a67a94-a9cf-4efa-8433-6a5051d926b4",
        "projectName": "Aushub Pool",
        ...
    }
]
```

## Delete project

**Use-Case**: As a user of the management app, I would like to have full control over my data.

**Parameters**:

- projectID: The UUID of the project to delete.

**Request**:

```
POST https://projects.limelapse.com/<projectId>/delete
```

```
204 NO CONTENT
```

## Search images

**Use-Case**: As a timelapse creator I would like to find the best pictures for my timelapse.

**Parameters**:

- query: The search query for the similarity search
- page: The page number of the response
- size: The page size of the response

**Request**:

```
POST https://search.limelapse.com

{
    "projectId": "<uuid>",
    "query": "baggerfahrer klaus",
    "timeStart": "2025-04-28T19:38",
    "timeEnd": "2026-04-28T19:38",
    "page": 0,
    "size": 50
}
```

**Response**:

```
200 OK 

{
    "totalResults": "20013",
    "hits": [
        {
            "imageId": "<uuid>",
            "distance": 0.24512412,
        }, 
        {
            "imageId": "<uuid>",
            "distance": 1.2321,
        },
        ...
    ]

}
```

## Search heatmap

**Use-Case**: Generate a heatmap for all the pictures in the project

**Request**:

```
POST https://search.limelapse.com/heatmap

{
    "query": "baggerfahrer klaus"
}
```

**Response**:

```
200 OK
{
    "heatmap": [ 0.5, 0.33, ..., 0.8721, 0.12] 
} 
```

The response is heatmap over the whole timeline of the project. An entry in the heatmap is a heat-value. A heat-value
is float between 0 and 1. The value 1 means high-heat i.e. good match. The value 0 means low-heat i.e. bad match.

The number of heat values do not directly correspond to the number of images in the project. Heat values might aggregate
multiple images due to performance concerns. Heat values are always equidistant across the project timeline.

## Generate video

**Parameters**:

- projectId: UUID of the project
- imageIds: Images to include in the timelapse video. The ordering of the imageIds corresponds to the order in the
  video. Thus imageIds should be ordered by timestamp in the frontend.

**Request**:

```
POST https://video.limelapse.com/generate

{
    "projectId": "<uuid>",
    "images": [
        "<imageId>",
        "<imageId>",
        "<imageId>",
        "<imageId>",
        "<imageId>",
        "<imageId>",
        ...
    ]
}
```

**Response**:

```
201 CREATED 
{
    "videoId": <uuid>
}
```

A video is not directly generated upon invocation. The user can fetch the generated video at a later point with the
returned videoId.

## List videos

**Use-Case**: I want to list and refetch my generated timelapse videos.

**Request**:

```
POST https://video.limelapse.com/list

{
    "projectId": "<uuid>"
}
```

**Response**:

```
200 OK 
{
    "videos": [
        {
            "videoId": "<uuid>",
            "generatedAt": "2025-04-28T20:03",
            "state": "QUEUED" | "PROCESSING" | "FINISHED",
        }
    ]
}
```

The response contains all timelapse-videos that the user created in this project. If a video is still processing
the download url is not present in the response.

For the video-download you need to use the token provided by *File Access* and download via S3 protocol.

## Client telemetry

**Use-Case**: The mobile app uploads regularly telemetry information.

**Request**:

```
POST https://telemetry.limelapse.com

{
    "projectId": "<uuid>",
    "batteryLevel": 0.55,
    "connectionQuality": 0.75
}
```

**Result**:

```
204 NO CONTENT
```