import importlib.util
import json
import logging
import os
import platform
import subprocess
import sys
import threading
from pathlib import Path

# Set up logging
# Check for debug flag
debug_mode = "--debug" in sys.argv
log_level = logging.DEBUG if debug_mode else logging.INFO

logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("minikube-setup")

if debug_mode:
    logger.debug("Debug mode enabled - showing verbose output")


def import_from_path(module_name, file_path):
    logger.info(f"Importing {module_name} from {file_path}")
    sys.path.insert(0, os.path.dirname(file_path))
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    sys.path.pop(0)
    return module


ROOT_DIR = Path(__file__).resolve().parent.parent
INFRA_DIR = ROOT_DIR / "infra"
APPS_DIR = ROOT_DIR / "apps"

logger.info(f"ROOT_DIR: {ROOT_DIR}")
logger.info(f"INFRA_DIR: {INFRA_DIR}")
logger.info(f"APPS_DIR: {APPS_DIR}")

try:
    functions = import_from_path('build-functions', os.path.join(INFRA_DIR, 'deploy-functions.py'))
    deploy_ms = import_from_path('deploy-ms', os.path.join(INFRA_DIR, 'deploy-ms.py'))
    deploy_bas = import_from_path('deploy-bas', os.path.join(INFRA_DIR, 'deploy-bas.py'))
    deploy_ic = import_from_path('deploy-ic', os.path.join(INFRA_DIR, 'deploy-ic.py'))
    deploy_knative = import_from_path('deploy-knative', os.path.join(INFRA_DIR, 'deploy-knative.py'))
    microservices = import_from_path('microservices', os.path.join(INFRA_DIR, 'deploy-ms.py'))
    deploy_service = import_from_path('deploy-service', os.path.join(INFRA_DIR, 'deploy-service.py'))
    logger.info("All modules imported successfully")
except Exception as e:
    logger.error(f"Failed to import modules: {e}")
    sys.exit(1)

FQDN = os.getenv("FQDN", "limelapse.com")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")

logger.info(f"FQDN: {FQDN}")

# Defaults
DEFAULT_MEMORY = "6656"
DEFAULT_CPUS = "4"
DEFAULT_DISK_SIZE = "40g"

# Read from environment variables, fallback to defaults
MEMORY = os.getenv("MINIKUBE_MEMORY", DEFAULT_MEMORY)
CPUS = os.getenv("MINIKUBE_CPUS", DEFAULT_CPUS)
DISK_SIZE = os.getenv("MINIKUBE_DISK_SIZE", DEFAULT_DISK_SIZE)

logger.info(f"Configured with {MEMORY} MB RAM and {CPUS} CPUs")

# Microservices config path
MICROSERVICES_CONFIGS = [
    os.path.join(APPS_DIR, 'ml-services/services.yaml'),
    os.path.join(APPS_DIR, 'web-client/services.yaml'),
]
logger.info(f"Microservices configs: {MICROSERVICES_CONFIGS}")

IS_WINDOWS = platform.system() == "Windows"
logger.info(f"Platform: {platform.system()}")

# TODO: it would be ideal to read those names from a central point
HOST_ENTRIES = [
    f"sso.{FQDN}",
    f"jaeger.{FQDN}",
    f"minio.{FQDN}",
    f"download.{FQDN}",
    f"minioadmin.{FQDN}",
]

HOST_ENTRIES = HOST_ENTRIES + [f + f".{FQDN}" for f in functions.functions_with_ingress()]

# Add microservices host entries
# TODO: make this optional (not all microservices need to be available from the outside)
try:
    for config_path in MICROSERVICES_CONFIGS:
        logger.info(f"Loading services from {config_path}")
        services = microservices.get_all_services(config_path)
        for service in services:
            host_entry = f"{service}.{FQDN}"
            HOST_ENTRIES.append(host_entry)
            logger.info(f"Added host entry: {host_entry}")
except Exception as e:
    logger.warning(f"Could not load microservices config to add host entries: {e}")

TAG_COMMENT = "# added-by-limelapse"


def run_command(cmd, shell=False, env=None, check=True):
    cmd_str = ' '.join(cmd) if isinstance(cmd, list) else cmd
    logger.info(f"Running command: {cmd_str}")

    # Use Popen for real-time output
    try:
        process = subprocess.Popen(
            cmd,
            shell=shell,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding='utf-8',
            errors='replace',
            bufsize=1,
            universal_newlines=True
        )

        stdout_lines = []
        stderr_lines = []

        def read_stream(stream, stream_list, is_stdout=True):
            for line in stream:
                stream_list.append(line)
                line = line.rstrip()
                if is_stdout:
                    logger.info(f"Command output: {line}")
                    print(f"[OUT] {line}")
                else:
                    log_level = logging.ERROR if check else logging.WARNING
                    logger.log(log_level, f"Command {'error' if check else 'stderr'}: {line}")
                    print(f"[ERR] {line}", file=sys.stderr)

        # Start threads to read output
        stdout_thread = threading.Thread(target=read_stream, args=(process.stdout, stdout_lines, True))
        stderr_thread = threading.Thread(target=read_stream, args=(process.stderr, stderr_lines, False))
        stdout_thread.start()
        stderr_thread.start()

        # Wait for completion
        stdout_thread.join()
        stderr_thread.join()
        returncode = process.wait()

        # Mimic CompletedProcess
        class CompletedProcessLike:
            def __init__(self, args, returncode, stdout, stderr):
                self.args = args
                self.returncode = returncode
                self.stdout = ''.join(stdout)
                self.stderr = ''.join(stderr)

        result = CompletedProcessLike(cmd, returncode, stdout_lines, stderr_lines)

        if check and returncode != 0:
            logger.error(f"Command failed with exit code {returncode}")
            if not stderr_lines:
                raise subprocess.CalledProcessError(returncode, cmd)

        logger.info(f"Command completed with exit code {returncode}")
        return result
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        raise


def is_minikube_running():
    try:
        result = subprocess.run(
            ["minikube", "status", "--output=json"],
            check=True,
            capture_output=True,
            text=True
        )
        status = json.loads(result.stdout)
        return status.get("Host", "").lower() == "running"
    except Exception as e:
        logger.warning(f"Could not determine Minikube status: {e}")
        return False


def start_minikube():
    if is_minikube_running():
        logger.info("Minikube is already running. Skipping start.")
        return
    logger.info("Starting Minikube...")
    cmd = ["minikube", "start", "--addons=ingress"]

    if ENVIRONMENT == "local":
        cmd += [f"--memory={MEMORY}", f"--cpus={CPUS}", f"--disk-size={DISK_SIZE}", "--force"]

    if IS_WINDOWS:
        try:
            logger.info("Checking for Hyper-V on Windows")
            result = subprocess.run(
                ["powershell", "-Command", "Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All"],
                check=True,
                capture_output=True,
                text=True,
                encoding='mbcs'
            )
            if "Enabled" in result.stdout:
                cmd += ["--driver=hyperv"]
                logger.info("Hyper-V is enabled. Using --driver=hyperv.")
            else:
                logger.info("Hyper-V is not enabled. Skipping --driver=hyperv.")
        except subprocess.CalledProcessError as e:
            logger.warning(f"Failed to check Hyper-V status: {e}")
            logger.warning("Skipping --driver=hyperv.")

    run_command(cmd)
    logger.info("Minikube started successfully")


def stop_minikube():
    logger.info("Stopping Minikube...")
    run_command(["minikube", "stop"])
    logger.info("Minikube stopped")


def delete_minikube():
    logger.info("Deleting Minikube cluster...")
    run_command(["minikube", "delete"])
    logger.info("Minikube cluster deleted")


def is_docker_driver():
    logger.info("Checking Minikube driver...")
    result = run_command(["minikube", "profile", "list", "-o", "json"])
    profiles = json.loads(result.stdout)

    current_profile = profiles["valid"][0] if profiles["valid"] else None
    driver = current_profile.get("Config", {}).get("Driver") if current_profile else None
    logger.info(f"Minikube driver: {driver}")
    return driver == "docker"


def get_minikube_ip():
    logger.info("Getting Minikube IP...")
    result = run_command(["minikube", "ip"])
    ip = result.stdout.strip()
    logger.info(f"Minikube IP: {ip}")
    return ip


def get_host_ip():
    if is_docker_driver():
        logger.info("Minikube is using Docker driver. Returning 127.0.0.1")
        return "127.0.0.1"
    return get_minikube_ip()


def get_hosts_file_path():
    if IS_WINDOWS:
        path = r"C:\Windows\System32\drivers\etc\hosts"
    else:
        path = "/etc/hosts"
    logger.info(f"Hosts file path: {path}")
    return path


def read_hosts_file(path):
    try:
        logger.info(f"Reading hosts file from {path}")
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        logger.info(f"Read {len(lines)} lines from hosts file")
        return lines
    except Exception as e:
        logger.error(f"Error reading hosts file: {e}")
        return []


def write_hosts_file(path, new_lines, mode="a"):
    try:
        logger.info(f"Writing to hosts file {path} (mode: {mode})")
        with open(path, mode, encoding="utf-8") as f:
            f.writelines(new_lines)
        logger.info(f"Successfully wrote {len(new_lines)} lines to hosts file")
    except Exception as e:
        logger.error(f"Failed to write to hosts file: {e}")
        logger.error("Please run this script with elevated permissions (sudo or administrator).")
        if not IS_WINDOWS:
            logger.info(
                "Run the following command to append to hosts file on Linux:\necho -e \"%s\" | sudo tee --append /etc/hosts",
                "".join(new_lines))


def ensure_host_entries():
    logger.info("Ensuring host entries are present...")
    hosts_path = get_hosts_file_path()
    lines = read_hosts_file(hosts_path)
    existing = "".join(lines)

    new_lines = []
    changes_needed = False
    ip = get_host_ip()

    for hostname in HOST_ENTRIES:
        entry = f"{ip} {hostname} {TAG_COMMENT}\n"
        if hostname not in existing:
            logger.info(f"Adding host entry: {ip} {hostname}")
            new_lines.append(entry)
            changes_needed = True
        else:
            logger.info(f"Host entry already present: {hostname}")

    if changes_needed:
        logger.info(f"Adding {len(new_lines)} new host entries")
        write_hosts_file(hosts_path, new_lines, mode="a")
        logger.info("Host entries added successfully")
    else:
        logger.info("All host entries already exist. Nothing to do.")


def remove_host_entries():
    logger.info("Removing tagged host entries...")
    hosts_path = get_hosts_file_path()
    lines = read_hosts_file(hosts_path)

    original_count = len(lines)
    cleaned_lines = [line for line in lines if TAG_COMMENT not in line]
    removed_count = original_count - len(cleaned_lines)

    if removed_count == 0:
        logger.info("No entries to remove.")
    else:
        logger.info(f"Removing {removed_count} host entries")
        write_hosts_file(hosts_path, cleaned_lines, mode="w")
        logger.info("Tagged host entries removed.")


def deploy_microservices():
    logger.info("Building and deploying microservices...")
    total_success = True

    try:
        for config_path in MICROSERVICES_CONFIGS:
            if not os.path.exists(config_path):
                logger.warning(f"Microservices config file {config_path} does not exist.")
                continue

            logger.info(f"Deploying microservices from {config_path}")
            # Build and deploy microservices
            success = microservices.build_and_deploy(fqdn=FQDN, config_path=config_path)

            if success:
                logger.info(f"Microservices from {config_path} deployed successfully.")
            else:
                logger.warning(f"Some microservices from {config_path} may not have deployed correctly.")
                total_success = False
    except Exception as e:
        logger.error(f"Error deplorying microservices: {e}")
        total_success = False

    return total_success


def up():
    logger.info("===== STARTING ENVIRONMENT =====")
    try:
        start_minikube()

        logger.info("Installing supporting services...")
        deploy_bas.install_supporting_services()

        logger.info("Installing ingress controller...")
        deploy_ic.install_ingress_controller()

        logger.info("Installing Knative...")
        deploy_knative.install_knative()

        logger.info("Installing Jaeger...")
        deploy_knative.install_jaeger()

        deploy_microservices()

        logger.info("Deploying timelapse-export service...")
        deploy_service.build_and_deploy(FQDN, "timelapse-export")

        logger.info("Building functions...")
        functions.build("all", native_build=False, use_builder_image=True)

        logger.info("Deploying functions...")
        functions.deploy_function("all")

        ensure_host_entries()

        logger.info("===== ENVIRONMENT SETUP COMPLETE =====")
        logger.info("All done! Use 'minikube service <service-name> --url' to test.")
    except Exception as e:
        logger.error(f"Failed to set up environment: {e}")
        logger.error("Environment setup failed. Please check the logs for details.")


def down():
    logger.info("===== SHUTTING DOWN ENVIRONMENT =====")
    try:
        stop_minikube()
        delete_minikube()
        remove_host_entries()
        logger.info("Environment shut down successfully.")
    except Exception as e:
        logger.error(f"Failed to shut down environment: {e}")


def tunnel():
    logger.info("Starting Minikube tunnel...")
    try:
        run_command(["minikube", "tunnel"])
    except KeyboardInterrupt:
        logger.info("Tunnel stopped by user.")
    except Exception as e:
        logger.error(f"Tunnel error: {e}")


def get_ssh_key_path():
    result = run_command(["minikube", "ssh-key"])
    return result.stdout.strip()


def get_ssh_port_from_docker():
    try:
        result = run_command(["docker", "port", "minikube", "22"])
        port_str = result.stdout.strip().split(":")[-1]
        return int(port_str)
    except subprocess.CalledProcessError:
        return None


def start_minikube_ssh_tunnel():
    key_path = get_ssh_key_path()
    ssh_port = get_ssh_port_from_docker()

    if not ssh_port:
        raise RuntimeError("Failed to determine SSH port for Minikube.")

    minikube_ip = get_minikube_ip()
    public_ip = "0.0.0.0"

    ssh_cmd = [
        "ssh",
        "-i", key_path,
        "-L", f"{public_ip}:80:{minikube_ip}:80", "-L", f"{public_ip}:443:{minikube_ip}:443",
        "docker@127.0.0.1",
        "-p", str(ssh_port),
        "-N"
    ]

    logger.info(f"Starting SSH tunnel: {' '.join(ssh_cmd)}")
    run_command(ssh_cmd)


def hosts():
    remove_host_entries()
    ensure_host_entries()
    if is_docker_driver():
        start_minikube_ssh_tunnel()
    else:
        logger.info("No need to start SSH tunnel")


def main():
    logger.info("Script started")

    # Remove debug flag from args if present
    args = [arg for arg in sys.argv if arg != "--debug"]

    if len(args) < 2:
        logger.error("Insufficient arguments")
        print("Usage: python run_minikube.py {up|down|tunnel} [--debug]")
        sys.exit(1)

    command = args[1].lower()
    logger.info(f"Command: {command}")

    try:
        if command == "up":
            up()
        elif command == "down":
            down()
        elif command == "tunnel":
            tunnel()
        elif command == "hosts":
            hosts()
        else:
            logger.error(f"Unknown command: {command}")
            print("Usage: python run_minikube.py {up|down|tunnel} [--debug]")
            sys.exit(1)

        logger.info("Script completed")
    except KeyboardInterrupt:
        logger.warning("Script interrupted by user")
        print("\nScript was interrupted by user. You may need to clean up resources manually.")
    except Exception as e:
        logger.error(f"Script failed with error: {e}", exc_info=True)
        print(f"\nScript failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
