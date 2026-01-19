import argparse
import os
import platform
import subprocess
from pathlib import Path
from typing import Optional


IS_WINDOWS = platform.system() == "Windows"
SCRIPT_DIR = Path(__file__).resolve().parent

# Extracted constants
K8S_CONFIG_DIR = SCRIPT_DIR / "k8s"
TEMPLATE_FQDN_PLACEHOLDER = "{{fqdn}}"

def get_minikube_docker_env():
    """Returns a dict of environment variables to use Minikube's Docker daemon."""
    shell_arg = "cmd" if IS_WINDOWS else "bash"
    result = subprocess.run(
        ["minikube", "-p", "minikube", "docker-env", f"--shell={shell_arg}"],
        capture_output=True, text=True, check=True
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


def load_service_config(service: str, fqdn: str) -> Optional[str]:
    """Load service configuration file and replace template variables.

    Args:
        config_path: Path to the service configuration file
        fqdn: Fully Qualified Domain Name to replace in template
    Returns:
        Processed configuration content if successful, None otherwise
    """
    config_path = K8S_CONFIG_DIR / f"{service}.yaml"
    try:
        if not config_path.exists():
            print("Error: Configuration file not found.")
            return None

        with open(config_path, "r") as file:
            config_content = file.read()
            return config_content.replace(TEMPLATE_FQDN_PLACEHOLDER, fqdn)
        return None

    except IOError as e:
        print(f"Error reading configuration: {e}")
        return None


def build(fqdn, service):
    build_context = SCRIPT_DIR.parent / "apps" / service

    if not build_context.exists():
        print(f"Error: Build context directory '{build_context}' does not exist.")
        return False

    # Find Dockerfile path
    dockerfile_path = build_context / "Dockerfile"
    if not dockerfile_path.exists():
        print(f"Error: Dockerfile not found at {dockerfile_path}")
        return False

    print(f"Building Docker image for {service}...")
    cmd = [
        "docker",
        "build",
        str(build_context),
        "-f", str(dockerfile_path),
        "-t", f"{fqdn}/{service}:latest"
    ]

    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd, env=get_minikube_docker_env())

    if result.returncode == 0:
        print(f"Successfully built image {fqdn}/{service}:latest")
        return True
    else:
        print(f"Error building image for {service}")
        return False


def deploy_service(fqdn: str, service: str) -> bool:
    """Deploy the specified microservice(s) to Kubernetes."""

    # Load configuration and process templates
    prepared_config = load_service_config(service, fqdn)
    if prepared_config is None:
        return False
    
    # Deploy to Kubernetes
    try:
        result = subprocess.run(
            ["kubectl", "apply", "-f", "-"],
            input=prepared_config,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"Error deploying {service}: {result.stderr}")
            return False
            
        print(f"Successfully deployed {service}")
        return True
        
    except subprocess.SubprocessError as e:
        print(f"Deployment failed: {e}")
        return False


def delete_service(fqdn, service):
    """Delete the specified microservice(s) from Kubernetes."""

    # Load configuration and process templates
    prepared_config = load_service_config(service, fqdn)
    if prepared_config is None:
        return False

    result = subprocess.run(["kubectl", "delete", "-f", "-"], input=prepared_config, capture_output=True, text=True)
    if result.returncode != 0 and "not found" not in result.stderr:
        print(f"Error deleting {service}: {result.stderr}")
        return False

    print(f"Successfully deleted {service}")
    return True


def build_and_deploy(fqdn, service):
    """Build and deploy the specified microservice(s)."""
    build_success = build(fqdn, service)
    if not build_success:
        print("Build failed for one or more services.")
        return False

    deploy_success = deploy_service(fqdn, service)
    if not deploy_success:
        print("Deployment failed for one or more services.")
        return False

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build and deploy microservices to Kubernetes in Minikube")
    parser.add_argument("command",
                        help="Command to execute: 'build' to build Docker image, 'deploy' to deploy to Kubernetes, 'delete' to remove from Kubernetes")
    parser.add_argument("service",
                        help="Name of the microservice to build/deploy/delete (must match the directory name in apps/)")
    parser.add_argument("--fqdn", default="dev.local", help="Fully qualified domain name (default: dev.local)")
    args = parser.parse_args()

    if args.command == "build":
        success = build(args.fqdn, args.service)
        exit(0 if success else 1)
    elif args.command == "deploy":
        success = deploy_service(args.fqdn, args.service)
        exit(0 if success else 1)
    elif args.command == "delete":
        success = delete_service(args.fqdn, args.service)
        exit(0 if success else 1)
    else:
        parser.print_help()
        exit(1)