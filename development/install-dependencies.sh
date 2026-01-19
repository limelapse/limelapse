#!/bin/bash
set -e

# Detect OS
os="$(uname -s)"
case "$os" in
  Linux*|Darwin*)
    echo "Detected supported OS: $os"
    ;;
  *)
    echo "Unsupported operating system: $os"
    echo "This script only supports macOS and Linux."
    exit 1
    ;;
esac

echo "Checking prerequisites..."

missing=()

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed."
  missing+=("Docker")
fi

# Check if Minikube is installed
if ! command -v minikube &> /dev/null; then
  echo "Minikube is not installed."
  missing+=("Minikube")
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
  echo "kubectl is not installed."
  missing+=("kubectl")
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Node.js is not installed."
  missing+=("Node.js")
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
  echo "Python 3 is not installed."
  missing+=("Python")
fi

if [ ${#missing[@]} -eq 0 ]; then
  echo "All dependencies are already installed!"
  echo "You can now run `python3 run-minikube.py` to run Minikube and Knative."
  exit 0
fi

echo ""
echo "Missing dependencies: ${missing[*]}"
read -p "Install missing dependencies now? (y/n): " confirm

if [[ "$confirm" != [yY] ]]; then
  echo "Aborting installation. Please install the dependencies manually."
  exit 1
fi

# Install missing dependencies
for dep in "${missing[@]}"; do
  case "$dep" in
    Minikube)
      echo "Installing Minikube..."
      case "$os" in
        Linux*)
          curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
          sudo install minikube-linux-amd64 /usr/local/bin/minikube
          rm minikube-linux-amd64
          ;;
        Darwin*)
          brew install minikube
          ;;
      esac
      ;;
    kubectl)
      echo "Installing kubectl..."
      case "$os" in
        Linux*)
          curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
          sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
          rm kubectl
          ;;
        Darwin*)
          brew install kubectl
          ;;
      esac
      ;;
    Node.js)
      echo "Installing Node.js..."
      case "$os" in
        Linux*)
          curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
          sudo apt-get install -y nodejs
          ;;
        Darwin*)
          brew install node@22
          ;;
      esac
      ;;
    Python)
      echo "Installing Python 3..."
      case "$os" in
        Linux*)
          sudo apt-get update
          sudo apt-get install -y python3 python3-pip
		  sudo pip install pyyaml
          ;;
        Darwin*)
          brew install python
          ;;
      esac
      ;;
    Docker)
      echo "Docker is not installed. Please install Docker manually:"
      echo "Visit https://docs.docker.com/get-docker/"
      ;;
  esac
done

echo ""
echo "Dependency installation complete!"
echo "You can now run `python3 run-minikube.py` to run Minikube and Knative."
