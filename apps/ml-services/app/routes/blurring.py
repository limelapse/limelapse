from flask import Blueprint, request, jsonify
from app.services.blurring_service import BlurringService
from app.services.image_loading_service import ImageLoadingService, ImageDownloadError, ImageUploadError
from app.utils.image_loading_utils import (
    get_image_from_request, 
    get_upload_url_from_request,
    serve_image, 
    upload_image_and_respond
)

bp = Blueprint("blurring", __name__)

blurring_service = BlurringService()
image_loading_service = ImageLoadingService()

@bp.route("/full", methods=["POST"])
def blur_all():
    """
    Endpoint to blur the entire image.
    Accepts either an image file upload or a URL to an image.
    Optionally accepts an upload_url to store the processed image.
    """
    try:
        image = get_image_from_request(request, image_loading_service)
        if image is None:
            return jsonify({"error": "Either 'image' file or 'url' must be provided, but not both"}), 400
        
        blurred_image = blurring_service.full(image)
        
        upload_url = get_upload_url_from_request(request)
        if upload_url:
            return upload_image_and_respond(blurred_image, upload_url, image_loading_service)
        else:
            # Return the processed image directly
            return serve_image(blurred_image)
            
    except ImageDownloadError as e:
        return jsonify({
            "error": "Image download failed",
            "details": str(e),
            "url": e.url if hasattr(e, 'url') else None,
            "status_code": e.status_code if hasattr(e, 'status_code') else None
        }), 422
    except ImageUploadError as e:
        return jsonify({
            "error": "Image upload failed",
            "details": str(e),
            "url": e.url if hasattr(e, 'url') else None,
            "status_code": e.status_code if hasattr(e, 'status_code') else None
        }), 422
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route("/faces", methods=["POST"])
def blur_faces():
    """
    Endpoint to blur faces in the image.
    Accepts either an image file upload or a URL to an image.
    Optionally accepts an upload_url to store the processed image.
    """
    try:
        image = get_image_from_request(request, image_loading_service)
        if image is None:
            return jsonify({"error": "Either 'image' file or 'url' must be provided, but not both"}), 400
        
        blurred_image = blurring_service.blur_faces(image)
        
        upload_url = get_upload_url_from_request(request)
        if upload_url:
            return upload_image_and_respond(blurred_image, upload_url, image_loading_service)
        else:
            # Return the processed image directly
            return serve_image(blurred_image)
            
    except ImageDownloadError as e:
        return jsonify({
            "error": "Image download failed",
            "details": str(e),
            "url": e.url if hasattr(e, 'url') else None,
            "status_code": e.status_code if hasattr(e, 'status_code') else None
        }), 422
    except ImageUploadError as e:
        return jsonify({
            "error": "Image upload failed",
            "details": str(e),
            "url": e.url if hasattr(e, 'url') else None,
            "status_code": e.status_code if hasattr(e, 'status_code') else None
        }), 422
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500