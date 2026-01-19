import argparse
import os
import platform
import subprocess
from pathlib import Path

IS_WINDOWS = platform.system() == "Windows"
SCRIPT_DIR = Path(__file__).resolve().parent
FUNCTIONS_DIR = SCRIPT_DIR.parent / "apps" / "quarkus-functions"

SERVICE_TEMPLATE = """
    apiVersion: serving.knative.dev/v1
    kind: Service
    metadata:
      name: {function_name}
      namespace: default
    spec:
      template:
        spec:
          containers:
            - image: limelapse.com/{function_name}:latest
              imagePullPolicy: Never
              ports:
                - containerPort: 8080
    """

INGRESS_TEMPLATE = """
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: {function_name}-ingress
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
            - {function_name}.limelapse.com 
          secretName: {function_name}-tls
      rules:
      - host: {function_name}.limelapse.com 
        http:
          paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: knative-bridge
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


def function_dirs():
    return [dir.name for dir in FUNCTIONS_DIR.iterdir() if dir.is_dir() and dir.name.startswith("function-")]


def functions_with_ingress():
    """Returns a list of functions that have an ingress configured."""
    list = []
    for function in function_dirs():
        function_yaml_path = SCRIPT_DIR / "quarkus-functions" / (function + ".yaml")
        if function_yaml_path.exists():
            with function_yaml_path.open("r") as file:
                yaml_content = file.read()
                if yaml_content.find("kind: Ingress") != -1:
                    list.append(function)
    return list


def build(function, native_build=False, use_builder_image=False):
    functions_to_build = [function] if function != "all" else function_dirs()
    build_source = "from-builder" if use_builder_image else "from-local"
    dockerfile_source = "Dockerfile.native" if native_build else "Dockerfile.jvm"
    env = get_minikube_docker_env()
    for fun in functions_to_build:
        subprocess.run(
            [
                "docker",
                "build",
                str(FUNCTIONS_DIR),
                "-f", str(FUNCTIONS_DIR / dockerfile_source),
                "--build-arg", f"FUNCTION_NAME={fun}",
                f"--target={build_source}",
                "-t", f"limelapse.com/{fun}:latest"
            ],
            env=env
        )


def deploy_function(function="all"):
    functions_to_deploy = [function] if function != "all" else function_dirs()

    for fun in functions_to_deploy:
        function_yaml_path = SCRIPT_DIR / "quarkus-functions" / (fun + ".yaml")
        if function_yaml_path.exists():
            subprocess.run(["kubectl", "apply", "-f", f"{function_yaml_path}"])
        else:
            service = SERVICE_TEMPLATE.format(function_name=fun)
            ingress = INGRESS_TEMPLATE.format(function_name=fun)
            subprocess.run(["kubectl", "apply", "-f", "-"], input=service.encode("utf-8"))
            subprocess.run(["kubectl", "apply", "-f", "-"], input=ingress.encode("utf-8"))


parser = argparse.ArgumentParser(description="Build quarkus knative functions inside the minikube docker")
parser.add_argument("function_name", nargs="?", type=str,
                    help="The name of the function to build. If you omit this parameter all functions are build",
                    default="all")
parser.add_argument("--native_build", action="store_true", help="Whether to perform a native or java build")
parser.add_argument("--local_build", action="store_true",
                    help="Whether to build the sources within a docker-stage or to build it locally. Warning! If you choose to build locally this script only copies jar-files you are responsible to perform the quarkus-build by yourself")

if __name__ == "__main__":
    args = parser.parse_args()
    build(args.function_name, native_build=args.native_build, use_builder_image=not args.local_build)
    deploy_function(args.function_name)
