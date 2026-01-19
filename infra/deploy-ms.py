import argparse
import os
import platform
import subprocess
from pathlib import Path

import yaml

IS_WINDOWS = platform.system() == "Windows"
SCRIPT_DIR = Path(__file__).resolve().parent

# Kubernetes configuration templates
DEPLOYMENT_TEMPLATE = """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service_name}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {service_name}
  template:
    metadata:
      labels:
        app: {service_name}
    spec:
      containers:
        - name: {service_name}
          image: {fqdn}/{service_name}:latest
          imagePullPolicy: Never
          ports:
            - containerPort: {port}
          env:
{env_vars}
"""

SERVICE_TEMPLATE = """
apiVersion: v1
kind: Service
metadata:
  name: {service_name}
spec:
  selector:
    app: {service_name}
  ports:
    - protocol: TCP
      port: 80
      targetPort: {port}
"""

INGRESS_TEMPLATE = """
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {service_name}-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/preserve-host: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
    cert-manager.io/cluster-issuer: local-ca-issuer
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Forwarded-Proto $pass_access_scheme;
      proxy_set_header X-Forwarded-Port $pass_port;
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - {service_name}.{fqdn}
      secretName: {service_name}-tls
  rules:
  - host: {service_name}.{fqdn} 
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {service_name}
            port:
              number: 80
"""


def get_minikube_docker_env():
    """Returns a dict of environment variables to use Minikube's Docker daemon."""
    shell_arg = "cmd" if IS_WINDOWS else "bash"
    result = subprocess.run(
        ["minikube", "-p", "minikube", "docker-env", f"--shell={shell_arg}"],
        capture_output=True, text=True, check=True, errors='replace', encoding='utf-8'
    )

    env_vars = {}
    for line in result.stdout.splitlines():
        line = line.strip()
        if IS_WINDOWS:
            if line.startswith("SET "):
                key, value = line[4:].split("=", 1)
                env_vars[key] = value
        else:
            if line.startswith("export "):
                key, value = line[7:].split("=", 1)
                env_vars[key] = value.strip('"')

    return {**os.environ, **env_vars}


def load_services_config(config_path):
    """Load service configurations from YAML file."""
    with open(config_path, 'r') as file:
        return yaml.safe_load(file)


def get_all_services(config_path):
    """Get a list of all service names from the config."""
    config = load_services_config(config_path)
    return [service['name'] for service in config['services']]


def format_env_vars(env_vars):
    """Format environment variables for Kubernetes YAML."""
    if not env_vars:
        return ""

    formatted_vars = []
    for key, value in env_vars.items():
        formatted_vars.append(f"          - name: {key}\n            value: \"{value}\"")

    return "\n".join(formatted_vars)


def build(fqdn, config_path, service="all"):
    """Build Docker images for the specified microservice(s)."""
    config = load_services_config(config_path)
    env = get_minikube_docker_env()
    config_path = Path(config_path)
    build_context = config_path.parent
    if not build_context.exists():
        print(f"Error: Build context directory '{build_context}' does not exist.")
        return False

    services = config['services']
    if service != "all":
        services = [s for s in services if s['name'] == service]
        if not services:
            print(f"Error: Service '{service}' not found in configuration.")
            return False

    success = True
    for service_config in services:
        service_name = service_config['name']
        build_args = service_config.get('build_args', {})

        # Prepare build arguments
        build_arg_list = []
        for key, value in build_args.items():
            build_arg_list.extend(["--build-arg", f"{key}={value}"])

        # Find Dockerfile path
        dockerfile_path = build_context / "Dockerfile"
        if not dockerfile_path.exists():
            print(f"Error: Dockerfile not found at {dockerfile_path}")
            success = False
            continue

        print(f"Building Docker image for {service_name}...")
        cmd = [
            "docker",
            "build",
            str(build_context),
            "-f", str(dockerfile_path),
            *build_arg_list,
            "-t", f"{fqdn}/{service_name}:latest"
        ]

        print(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, env=env)

        if result.returncode == 0:
            print(f"Successfully built image {fqdn}/{service_name}:latest")
        else:
            print(f"Error building image for {service_name}")
            success = False

    return success


def deploy_service(fqdn, config_path, service="all", enable_ingress=True):
    """Deploy the specified microservice(s) to Kubernetes."""
    config = load_services_config(config_path)

    services = config['services']
    if service != "all":
        services = [s for s in services if s['name'] == service]
        if not services:
            print(f"Error: Service '{service}' not found in configuration.")
            return False

    success = True
    for service_config in services:
        svc_name = service_config['name']
        port = service_config.get('port', 5000)
        env_vars = format_env_vars(service_config.get('env_vars', {}))

        print(f"Deploying {svc_name} to Kubernetes...")

        # Apply Deployment
        deployment = DEPLOYMENT_TEMPLATE.format(
            service_name=svc_name,
            port=port,
            env_vars=env_vars,
            fqdn=fqdn
        )

        result = subprocess.run(
            ["kubectl", "apply", "-f", "-"],
            input=deployment.encode("utf-8"),
            capture_output=True
        )

        if result.returncode != 0:
            print(f"Error deploying {svc_name}: {result.stderr.decode()}")
            success = False
            continue

        # Apply Service
        service_config = SERVICE_TEMPLATE.format(service_name=svc_name, port=port)
        result = subprocess.run(
            ["kubectl", "apply", "-f", "-"],
            input=service_config.encode("utf-8"),
            capture_output=True
        )

        if result.returncode != 0:
            print(f"Error creating service for {svc_name}: {result.stderr.decode()}")
            success = False
            continue

        # Apply Ingress if requested
        if enable_ingress:
            ingress = INGRESS_TEMPLATE.format(service_name=svc_name, fqdn=fqdn)
            result = subprocess.run(
                ["kubectl", "apply", "-f", "-"],
                input=ingress.encode("utf-8"),
                capture_output=True
            )

            if result.returncode != 0:
                print(f"Error creating ingress for {svc_name}: {result.stderr.decode()}")
                success = False
                continue

        print(f"Successfully deployed {svc_name}")

    return success


def delete_service(config_path, service="all"):
    """Delete the specified microservice(s) from Kubernetes."""
    config = load_services_config(config_path)

    services = config['services']
    if service != "all":
        services = [s for s in services if s['name'] == service]
        if not services:
            print(f"Error: Service '{service}' not found in configuration.")
            return False

    success = True
    for service_config in services:
        svc_name = service_config['name']
        print(f"Deleting {svc_name} from Kubernetes...")

        # Delete Ingress
        result = subprocess.run(["kubectl", "delete", "ingress", f"{svc_name}-ingress"], capture_output=True)
        if result.returncode != 0 and "not found" not in result.stderr.decode():
            print(f"Error deleting ingress for {svc_name}: {result.stderr.decode()}")
            success = False

        # Delete Service
        result = subprocess.run(["kubectl", "delete", "service", svc_name], capture_output=True)
        if result.returncode != 0 and "not found" not in result.stderr.decode():
            print(f"Error deleting service for {svc_name}: {result.stderr.decode()}")
            success = False

        # Delete Deployment
        result = subprocess.run(["kubectl", "delete", "deployment", svc_name], capture_output=True)
        if result.returncode != 0 and "not found" not in result.stderr.decode():
            print(f"Error deleting deployment for {svc_name}: {result.stderr.decode()}")
            success = False

        print(f"Successfully deleted {svc_name}")

    return success


def build_and_deploy(fqdn, config_path, service="all", enable_ingress=True):
    """Build and deploy the specified microservice(s)."""
    build_success = build(fqdn, config_path, service)
    if not build_success:
        print("Build failed for one or more services.")
        return False

    deploy_success = deploy_service(fqdn, config_path, service, enable_ingress)
    if not deploy_success:
        print("Deployment failed for one or more services.")
        return False

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build and deploy microservices to Kubernetes in Minikube")
    parser.add_argument("--config", help="Path to services configuration YAML file")

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build microservice Docker images")
    build_parser.add_argument("service", nargs="?", default="all", help="Service to build (default: all)")
    build_parser.add_argument("--fqdn", default="limelapse.com", help="FQDN for the service (default: limelapse.com)")

    # Deploy command
    deploy_parser = subparsers.add_parser("deploy", help="Deploy microservices to Kubernetes")
    deploy_parser.add_argument("service", nargs="?", default="all", help="Service to deploy (default: all)")
    deploy_parser.add_argument("--no-ingress", action="store_true", help="Skip creating Ingress resources")
    deploy_parser.add_argument("--fqdn", default="limelapse.com", help="FQDN for the service (default: limelapse.com)")

    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete microservices from Kubernetes")
    delete_parser.add_argument("service", nargs="?", default="all", help="Service to delete (default: all)")

    args = parser.parse_args()

    if args.command == "build":
        success = build(args.fqdn, args.config, args.service)
        exit(0 if success else 1)
    elif args.command == "deploy":
        success = deploy_service(args.fqdn, args.config, args.service, not args.no_ingress)
        exit(0 if success else 1)
    elif args.command == "delete":
        success = delete_service(args.config, args.service)
        exit(0 if success else 1)
    else:
        parser.print_help()
        exit(1)
