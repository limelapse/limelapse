import os
import subprocess
import sys


def pip_install(service_type):
    # check if requirements-<service_type>.txt exists
    requirements_file = f"requirements-{service_type}.txt"
    print(f"Checking for {requirements_file}...")
    if os.path.exists(requirements_file):
        print(f"Installing dependencies from {requirements_file}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--default-timeout", "1000", "-r", requirements_file])
    else:
        print(f"Requirements file {requirements_file} not found. Skipping installation.")

def install_pgk(pkg):
    """
    Installs a package using pip.
    """
    try:
        subprocess.check_call(["apt-get", "install", "-y", pkg])
        print(f"Successfully installed {pkg}.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to install {pkg}. Error: {e}")


def fetch_and_cache_embedding_model():
    """
    Downloads and caches the CLIP model and processor from Hugging Face Hub.
    This ensures that the models are available locally and can be loaded quickly
    the next time the service is started.
    """
    print("Fetching and caching the CLIP model and processor...")

    from transformers import CLIPProcessor, CLIPModel

    embedding_model = os.getenv("EMBEDDING_MODEL_NAME", "openai/clip-vit-base-patch16")

    # Fetch and cache the model and processor
    CLIPModel.from_pretrained(embedding_model)
    CLIPProcessor.from_pretrained(embedding_model)

    print("CLIP model and processor have been cached successfully.")

def fetch_and_cache_recognition_models():
    """
    Downloads and caches the recognition models from Hugging Face Hub.
    This ensures that the models are available locally and can be loaded quickly
    the next time the service is started.
    """
    print("Fetching and caching the recognition models...")

    import torch

    install_pgk("libgl1")
    install_pgk("libglib2.0-0")

    model_repo = os.getenv("RECOGNITION_MODEL_REPO", "ultralytics/yolov5")
    model_name = os.getenv("RECOGNITION_MODEL_NAME", "yolov5s")
    
    torch.hub.load(model_repo, model_name, pretrained=True)

    print("Recognition models have been cached successfully.")


if __name__ == "__main__":
    service_type = os.getenv("SERVICE_TYPE", "").lower()

    pip_install(service_type=service_type)

    if service_type == "embedding":
        fetch_and_cache_embedding_model()
    elif service_type == "blurring":
        fetch_and_cache_recognition_models()    
    else:
        print(f"This script is not applicable for the {service_type} service.")
