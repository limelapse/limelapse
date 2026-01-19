import io
from flask import send_file, jsonify
from app.services.image_loading_service import ImageDownloadError, ImageUploadError

def get_image_from_request(request, image_loading_service):
    """
    Helper function to extract image from the request.
    Accepts either an image file upload or a URL to an image.
    
    Args:
        request: Flask request object
        image_loading_service: Service used to download images from URLs
        
    Returns:
        file-like object containing the image data or None if invalid input parameters
        
    Raises:
        ImageDownloadError: If the image fails to download from the provided URL
    """
    has_file = 'image' in request.files and request.files['image'].filename != ''
    has_url = 'url' in request.form and request.form['url'].strip() != ''
    
    # Check if both or neither parameters are provided
    if (has_file and has_url) or (not has_file and not has_url):
        return None
    
    if has_file:
        return request.files['image']
    else:
        # Download from URL - let any ImageDownloadError propagate to the caller
        url = request.form['url']
        return image_loading_service.download_image(url)

def get_upload_url_from_request(request):
    """
    Helper function to extract the upload URL from the request if present.
    
    Args:
        request: Flask request object
        
    Returns:
        str: Upload URL or None if not provided
    """
    upload_url = request.form.get('upload_url', '').strip()
    return upload_url if upload_url else None

def serve_image(image):
    """
    Convert PIL Image to file-like object and serve it
    
    Args:
        image: PIL Image object
        
    Returns:
        Flask response object with the image data
    """
    img_io = io.BytesIO()
    image.save(img_io, format="JPEG")
    img_io.seek(0)
    return send_file(img_io, mimetype="image/jpeg")

def upload_image_and_respond(image, upload_url, image_loading_service):
    """
    Upload an image to the specified URL and return a success response.
    
    Args:
        image: PIL Image object
        upload_url: URL to upload the image to
        image_loading_service: Service used to upload the image
        
    Returns:
        Flask response object with success message
        
    Raises:
        ImageUploadError: If the image fails to upload
    """
    # Convert PIL image to file-like object
    img_io = io.BytesIO()
    image.save(img_io, format="JPEG")
    img_io.seek(0)
    
    # Upload the image
    image_loading_service.upload_image(upload_url, img_io)
    
    # Return success response
    return jsonify({
        "success": True,
        "message": "Image processed and uploaded successfully",
        "upload_url": upload_url
    })