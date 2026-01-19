import os

class Config:
    SERVICE_TYPE = os.getenv("SERVICE_TYPE", "").lower()
    EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "openai/clip-vit-base-patch16")
    RECOGNITION_MODEL_REPO = os.getenv("RECOGNITION_MODEL_REPO", "ultralytics/yolov5")
    RECOGNITION_MODEL_NAME = os.getenv("RECOGNITION_MODEL_NAME", "yolov5s")
    EMBEDDING_VECTOR_DIM = int(os.getenv("EMBEDDING_VECTOR_DIM", 768))
    
