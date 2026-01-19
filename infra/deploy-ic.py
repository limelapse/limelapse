import subprocess
import time
from pathlib import Path

from util.wait_for_pod import wait_for_pod_ready

SCRIPT_DIR = Path(__file__).resolve().parent
INFRA_K8S_DIR = SCRIPT_DIR / "k8s"


def install_ingress_controller():
    subprocess.run(["minikube", "addons", "enable", "ingress"])

    # Wait for the ingress controller to be ready
    print("Waiting for ingress-nginx controller to be ready...")
    wait_for_pod_ready("ingress-nginx", "app.kubernetes.io/component=controller", timeout_sec=300)

    # Sleep a bit more to ensure webhook is fully registered
    print("Waiting for admission webhook to be ready...")
    time.sleep(10)

    # Apply ingress configuration
    max_retries = 5
    for attempt in range(max_retries):
        try:
            subprocess.run(["kubectl", "apply", "-f", str(INFRA_K8S_DIR / "ingress-controller-service.yaml")])
            subprocess.run(["kubectl", "apply", "-f", str(INFRA_K8S_DIR / "ingress.yaml")])
            print("Successfully applied ingress configuration")
            break
        except subprocess.CalledProcessError as e:
            if attempt < max_retries - 1:
                print(f"Error applying ingress, retrying in 10 seconds (attempt {attempt + 1}/{max_retries})...")
                time.sleep(10)
            else:
                print("Failed to apply ingress after multiple attempts")
                raise e


if __name__ == "__main__":
    install_ingress_controller()
