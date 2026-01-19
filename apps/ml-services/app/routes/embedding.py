from flask import Blueprint, request, jsonify
from app.services.embedding_service import EmbeddingService
from app.services.image_loading_service import ImageLoadingService, ImageDownloadError
from app.utils.image_loading_utils import get_image_from_request

bp = Blueprint("embedding", __name__)

embedding_service = EmbeddingService()
image_loading_service = ImageLoadingService()

@bp.route("/text", methods=["POST"])
def embed_text():
    """
    Endpoint to create embeddings from text.
    Expects a JSON body with a 'text' field.
    """
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Request must include a 'text' field"}), 400
            
        embedding = embedding_service.embed_text(data["text"])
        dim = embedding.shape[0]
        return jsonify({"dimension": dim, "embedding": embedding.tolist()})
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route("/image", methods=["POST"])
def embed_image():
    """
    Endpoint to create embeddings from images.
    Accepts either an image file upload or a URL to an image.
    """
    try:
        image = get_image_from_request(request, image_loading_service)
        if image is None:
            return jsonify({"error": "Either 'image' file or 'url' must be provided, but not both"}), 400
        
        embedding = embedding_service.embed_image(image)
        dim = embedding.shape[0]
        return jsonify({"dimension": dim, "embedding": embedding.tolist()})
        
    except ImageDownloadError as e:
        return jsonify({
            "error": "Image download failed",
            "details": str(e),
            "url": e.url if hasattr(e, 'url') else None,
            "status_code": e.status_code if hasattr(e, 'status_code') else None
        }), 422
    except ValueError as e:
        # Handle potential value errors from the embedding service
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        # Handle any other unexpected errors
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500