from flask import Flask
from .config import Config
from .registry import ServiceRegistry

def create_app():
    app = Flask(__name__)

    # Register the appropriate service based on the SERVICE_TYPE environment variable
    service_blueprint = ServiceRegistry.get_blueprint(Config.SERVICE_TYPE)
    if not service_blueprint:
        raise ValueError(f"Unknown or unsupported SERVICE_TYPE: {Config.SERVICE_TYPE}")
    
    app.register_blueprint(service_blueprint)
    return app
