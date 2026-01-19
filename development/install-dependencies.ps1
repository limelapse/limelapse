# PowerShell script to check and install dependencies for Minikube and Knative

# Stop on error
$ErrorActionPreference = "Stop"




# Check OS
$os = $env:OS
if ($os -notlike "*Windows*") {
    Write-Host "Unsupported operating system: $os"
    Write-Host "This script only supports Windows via PowerShell."
    pause
	exit 1
}
Write-Host "Detected supported OS: Windows"

# Ensure the script is running as Administrator
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script must be run as Administrator."
    Write-Host "Right-click on PowerShell and select 'Run as administrator'."
    pause
	exit 1
}


Write-Host "Checking prerequisites..."
$missing = @()

# Helper function to check if a command exists
function CommandExists($command) {
    return Get-Command $command -ErrorAction SilentlyContinue
}

# Check Docker
if (-not (CommandExists "docker")) {
    Write-Host "Docker is not installed."
    $missing += "Docker"
}

# Check Minikube
if (-not (CommandExists "minikube")) {
    Write-Host "Minikube is not installed."
    $missing += "Minikube"
}

# Check kubectl
if (-not (CommandExists "kubectl")) {
    Write-Host "kubectl is not installed."
    $missing += "kubectl"
}

# Check Node.js
if (-not (CommandExists "node")) {
    Write-Host "Node.js is not installed."
    $missing += "Node.js"
}

# Check Python 3
if (-not (CommandExists "python3")) {
    Write-Host "Python 3 is not installed."
    $missing += "Python"
}

if ($missing.Count -eq 0) {
    Write-Host "All dependencies are already installed!"
    Write-Host "You can now run ./development/run-minikube.sh to run Minikube and Knative."
    exit 0
}

Write-Host "`nMissing dependencies: $($missing -join ', ')"
$confirm = Read-Host "Install missing dependencies now? (y/n)"
if ($confirm -notmatch "^[yY]") {
    Write-Host "Aborting installation. Please install the dependencies manually."
    exit 1
}

foreach ($dep in $missing) {
    switch ($dep) {
		"Minikube" {
			Write-Host "Installing Minikube..."
			$minikubeDir = Join-Path $env:ProgramFiles "minikube"
			$minikubeExe = Join-Path $minikubeDir "minikube.exe"

			if (-not (Test-Path $minikubeDir)) {
				New-Item -ItemType Directory -Path $minikubeDir | Out-Null
			}

			if (-not (Test-Path "minikube.exe")) {
				Invoke-WebRequest -Uri "https://storage.googleapis.com/minikube/releases/latest/minikube-windows-amd64.exe" -OutFile "minikube.exe"
				
			} else {
				Write-Host "Minikube executable already exists. Skipping download."
			}
			Move-Item "minikube.exe" $minikubeExe -Force
			[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$minikubeDir", [System.EnvironmentVariableTarget]::Machine)
		}
		"kubectl" {
			Write-Host "Installing kubectl..."
			$kubectlDir = Join-Path $env:ProgramFiles "kubectl"
			$kubectlExe = Join-Path $kubectlDir "kubectl.exe"

			if (-not (Test-Path $kubectlDir)) {
				New-Item -ItemType Directory -Path $kubectlDir | Out-Null
			}

			if (-not (Test-Path "kubectl.exe")) {
				$latest = Invoke-RestMethod -Uri "https://dl.k8s.io/release/stable.txt"
				$kubectlUrl = "https://dl.k8s.io/release/$latest/bin/windows/amd64/kubectl.exe"
				Invoke-WebRequest -Uri $kubectlUrl -OutFile "kubectl.exe"
			} else {
				Write-Host "kubectl executable already exists. Skipping download."
			}
			Move-Item "kubectl.exe" $kubectlExe -Force

			[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$kubectlDir", [System.EnvironmentVariableTarget]::Machine)
		}
        "Node.js" {
            Write-Host "Installing Node.js (LTS)..."
            # This uses the Node.js Windows installer
            $nodeInstaller = "https://nodejs.org/dist/v22.0.0/node-v22.0.0-x64.msi"
            Invoke-WebRequest -Uri $nodeInstaller -OutFile "node-installer.msi"
            Start-Process msiexec.exe -Wait -ArgumentList "/i node-installer.msi /quiet /norestart"
            Remove-Item "node-installer.msi"
        }
        "Docker" {
            Write-Host "Docker is not installed. Please install Docker manually:"
            Write-Host "Visit https://docs.docker.com/get-docker/"
        }
		"Python" {
			Write-Host "Installing Python 3..."
			# Attempt install via winget, fallback to manual
			if (Get-Command "winget" -ErrorAction SilentlyContinue) {
				winget install -e --id Python.Python.3
				pip install pyyaml
			} else {
				Write-Host "Please install Python 3 manually:"
				Write-Host "Visit https://www.python.org/downloads/windows/"
			}
		}
    }
}

Write-Host "`nDependency installation complete!"
Write-Host "You can now run python3 ./run-minikube.py to run Minikube and Knative."