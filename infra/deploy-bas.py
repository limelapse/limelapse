import subprocess
from pathlib import Path

from util.wait_for_pod import wait_for_pod_ready

CERT_MANAGER_VERSION = "v1.16.1"
OT_VERSION = "v0.123.0"
SCRIPT_DIR = Path(__file__).resolve().parent
INFRA_K8S_DIR = SCRIPT_DIR / "k8s"


def install_supporting_services():
    print("Setting up cert")
    deploy_cert()
    print("Installing Postgres...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_K8S_DIR / "postgres-persistent.yaml")])
    #Superseded
    #print("Installing ElasticSearch...")
    #subprocess.run(["kubectl", "apply", "-f", str(INFRA_K8S_DIR / "elasticsearch-persistent.yaml")])
    print("Installing KeyCloak")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_K8S_DIR / "keycloak-persistent.yaml")])
    print("Installing Minio...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_K8S_DIR / "minio-persistent.yaml")])


def deploy_cert():
    print("Installing cert-manager")
    subprocess.run(["kubectl", "apply", "-f",
                    f"https://github.com/cert-manager/cert-manager/releases/download/{CERT_MANAGER_VERSION}/cert-manager.yaml"])
    wait_for_pod_ready("cert-manager", "app=webhook", timeout_sec=360)
    subprocess.run(["kubectl", "create", "secret", "tls", "local-ca-secret", f"--cert={SCRIPT_DIR}/keys/ca.crt",
                    f"--key={SCRIPT_DIR}/keys/ca.key", "--namespace=cert-manager"])
    subprocess.run(["kubectl", "apply", "-f", f"{INFRA_K8S_DIR}/cluster-issuer.yaml"])


if __name__ == "__main__":
    install_supporting_services()
