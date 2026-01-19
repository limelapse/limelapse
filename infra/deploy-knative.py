import subprocess
from pathlib import Path

from util.wait_for_pod import wait_for_pod_ready

OT_VERSION = "v0.123.0"
SCRIPT_DIR = Path(__file__).resolve().parent
INFRA_K8S_DIR = SCRIPT_DIR / "k8s"
INFRA_KNATIVE_DIR = SCRIPT_DIR / "knative"

KNATIVE_VERSION = "knative-v1.12.0"
STRIMZI_VERSION = "0.46.0"
TIMEOUT = "300s"


def install_knative():
    print("Installing Knative Serving components...")
    base_url = f"https://github.com/knative/serving/releases/download/{KNATIVE_VERSION}"
    subprocess.run(["kubectl", "apply", "-f", f"{base_url}/serving-crds.yaml"])
    subprocess.run(["kubectl", "apply", "-f", f"{base_url}/serving-core.yaml"])
    subprocess.run(["kubectl", "apply", "-f",
                    f"https://github.com/knative/net-kourier/releases/download/{KNATIVE_VERSION}/kourier.yaml"])

    print("Waiting for Knative to be ready...")
    subprocess.run(
        ["kubectl", "wait", "pods", "--all", "--for=condition=Ready", "-n", "knative-serving", f"--timeout={TIMEOUT}"])

    print("Applying Knative configuration...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "config-deployment.yaml")])
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "config-network.yaml")])
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "config-domain.yaml")])
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "config-autoscaler.yaml")])
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "kourier-service.yaml")])

    print("Creating namespaces...")
    ensure_namespace("kafka")
    ensure_namespace("knative-eventing")

    print(f"Installing Strimzi Kafka Operator...")
    # TODO figure out how to pin version in URL :(
    subprocess.run([
        "kubectl", "apply", "-n", "kafka", "-f",
        f'https://strimzi.io/install/latest?namespace=kafka'
    ])

    print("Waiting for Strimzi to be ready...")
    subprocess.run([
        "kubectl", "wait", "deployment", "--all", "--for=condition=Available",
        "-n", "kafka", f"--timeout={TIMEOUT}"
    ])

    print("Deploying Kafka cluster...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "kafka-cluster.yaml")])

    print("Waiting for Kafka pods to be ready...")
    subprocess.run([
        "kubectl", "wait", "pods", "--all", "--for=condition=Ready",
        "-n", "kafka", f"--timeout={TIMEOUT}"
    ])
    # This is here multiple times because something below overwrites configs...
    print("Creating Kafka Secret for Knative Eventing...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "kafka-secret.yaml")])

    print("Installing Knative Eventing components...")
    eventing_base = f"https://github.com/knative/eventing/releases/download/{KNATIVE_VERSION}"
    subprocess.run(["kubectl", "apply", "-f", f"{eventing_base}/eventing-crds.yaml"])
    subprocess.run(["kubectl", "apply", "-f", f"{eventing_base}/eventing-core.yaml"])

    print("Creating Kafka Secret for Knative Eventing...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "kafka-secret.yaml")])

    print("Waiting for Knative Eventing to be ready...")
    subprocess.run(
        ["kubectl", "wait", "pods", "--all", "--for=condition=Ready", "-n", "knative-eventing", f"--timeout={TIMEOUT}"])

    print("Installing Knative Kafka Broker and Controller...")
    kafka_eventing_base = f"https://github.com/knative-extensions/eventing-kafka-broker/releases/download/{KNATIVE_VERSION}"
    subprocess.run(["kubectl", "apply", "-f", f"{kafka_eventing_base}/eventing-kafka-broker.yaml"])
    subprocess.run(["kubectl", "apply", "-f", f"{kafka_eventing_base}/eventing-kafka-controller.yaml"])
    print("Creating Kafka Secret for Knative Eventing...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "kafka-secret.yaml")])

    print("Waiting for Kafka Broker components to be ready...")
    subprocess.run(
        ["kubectl", "wait", "pods", "--all", "--for=condition=Ready", "-n", "knative-eventing", f"--timeout={TIMEOUT}"])

    print("Applying Kafka-backed Broker...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_KNATIVE_DIR / "eventing-kafka-broker.yaml")])


def ensure_namespace(namespace: str):
    """Create a namespace only if it doesn't already exist."""
    print(f"Ensuring namespace '{namespace}' exists...")
    result = subprocess.run(
        ["kubectl", "get", "namespace", namespace],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        subprocess.run(["kubectl", "create", "namespace", namespace])
    else:
        print(f"Namespace '{namespace}' already exists.")


def configure_knative_tracing():
    print("Patching Knative tracing configmaps...")

    namespaces = ["knative-serving", "knative-eventing"]
    patch = '{"data":{"backend":"zipkin","zipkin-endpoint":"http://jaeger-inmemory-instance-collector.default.svc:9411/api/v2/spans", "debug": "true"}}'

    for ns in namespaces:
        print(f"Patching tracing config in namespace: {ns}")
        subprocess.run([
            "kubectl", "patch",
            "--namespace", ns,
            "configmap/config-tracing",
            "--type", "merge",
            "--patch", patch
        ])


def install_jaeger():
    print("Installing OpenTelemetry Operator...")
    subprocess.run(["kubectl", "apply", "-f",
                    f"https://github.com/open-telemetry/opentelemetry-operator/releases/download/{OT_VERSION}/opentelemetry-operator.yaml"])
    wait_for_pod_ready("opentelemetry-operator-system", "app.kubernetes.io/name=opentelemetry-operator",
                       timeout_sec=360)
    print("Installing Jaeger...")
    subprocess.run(["kubectl", "apply", "-f", str(INFRA_K8S_DIR / "jaeger-inmemory.yaml")])

    configure_knative_tracing()


if __name__ == "__main__":
    install_knative()
    install_jaeger()
