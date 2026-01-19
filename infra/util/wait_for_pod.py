import subprocess
import time

def wait_for_pod_ready(namespace, label_selector, timeout_sec=180):
    """Wait for pods with the given label selector to be ready."""
    print(f"Waiting for pods with selector '{label_selector}' in namespace '{namespace}' to be ready...")
    deadline = time.time() + timeout_sec

    while time.time() < deadline:
        result = subprocess.run(
            ["kubectl", "get", "pods", "-n", namespace, "-l", label_selector, "-o", "jsonpath='{.items[*].status.containerStatuses[*].ready}'"],
            check=False,
            capture_output=True,
            text=True
        )

        if result.returncode == 0 and "false" not in result.stdout:
            print(f"Pods with selector '{label_selector}' in namespace '{namespace}' are ready")
            return True

        print(f"Waiting for pods to be ready... (timeout in {int(deadline - time.time())} seconds)")
        time.sleep(5)

    print(f"Timeout waiting for pods with selector '{label_selector}' in namespace '{namespace}'")
    return False