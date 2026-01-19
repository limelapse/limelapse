import torch
import numpy as np
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import io
from ..config import Config

class EmbeddingService:
    def __init__(self):
        # Preload and cache models during the service initialization
        CLIPModel.from_pretrained(Config.EMBEDDING_MODEL_NAME)
        CLIPProcessor.from_pretrained(Config.EMBEDDING_MODEL_NAME)
        
        self.model, self.processor = self._load_clip_model()
        self.dimension = self.model.config.projection_dim
        self.vector_dim = Config.EMBEDDING_VECTOR_DIM

    def _prefetch_models(self):
        """Preload models to ensure they are cached on disk."""
        print("Prefetching the CLIP model and processor...")
        CLIPModel.from_pretrained(Config.EMBEDDING_MODEL_NAME)
        CLIPProcessor.from_pretrained(Config.EMBEDDING_MODEL_NAME)
        print("CLIP model and processor preloaded successfully.")

    def _load_clip_model(self):
        """Load the CLIP model and processor from the cache."""
        model = CLIPModel.from_pretrained(Config.EMBEDDING_MODEL_NAME)
        processor = CLIPProcessor.from_pretrained(Config.EMBEDDING_MODEL_NAME)
        return model, processor

    def embed_text(self, text):
        inputs = self.processor(text=text, return_tensors="pt", padding=True)
        with torch.no_grad():
            embeddings = self.model.get_text_features(**inputs)
        # Remove batch dimension and convert to fixed dimension
        return self._convert_to_fixed_dim(embeddings.squeeze(0))

    def embed_image(self, image_file):
        image = Image.open(io.BytesIO(image_file.read()))
        inputs = self.processor(images=image, return_tensors="pt")
        with torch.no_grad():
            embeddings = self.model.get_image_features(**inputs)
        # Remove batch dimension and convert to fixed dimension
        return self._convert_to_fixed_dim(embeddings.squeeze(0))

    def _convert_to_fixed_dim(self, embeddings):
        """
        Convert embeddings to a fixed dimension and normalize them
        """
        target_dim = self.vector_dim
        original_dim = embeddings.shape[-1]

        if original_dim > target_dim:  # truncate
            result = embeddings[..., :target_dim]
        elif original_dim < target_dim:  # pad with zeros
            padding_size = target_dim - original_dim
            padding = torch.zeros(padding_size, device=embeddings.device, dtype=embeddings.dtype)
            result = torch.cat([embeddings, padding], dim=-1)
        else:  # no change
            result = embeddings

        result = torch.nn.functional.normalize(result, p=2, dim=-1)  # L2 normalization

        return result.cpu().numpy().flatten()
