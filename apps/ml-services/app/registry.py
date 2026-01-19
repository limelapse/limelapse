class ServiceRegistry:
    @classmethod
    def get_blueprint(cls, service_name):
        bp = None

        if service_name == "embedding":
            from .routes import embedding
            bp = embedding.bp
        elif service_name == "blurring":
            from .routes import blurring
            bp = blurring.bp
        else:
            raise ValueError(f"Unknown service name: {service_name}")

        return bp
