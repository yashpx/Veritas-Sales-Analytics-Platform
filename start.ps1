# Veritas Sales Management Platform - Unified Startup Script for Windows
# This script starts all components of the application in a single command

# Text formatting
$BOLD = "`e[1m"
$GREEN = "`e[32m"
$BLUE = "`e[34m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$RESET = "`e[0m"

# Set the project root directory
$PROJECT_ROOT = $PSScriptRoot
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$INSIGHTS_DIR = Join-Path $PROJECT_ROOT "insightspg"

# Function to check if a command exists
function Test-Command {
    param($Command)
    if (!(Get-Command $Command -ErrorAction SilentlyContinue)) {
        Write-Host "${RED}Error: $Command is not installed. Please install it and try again.${RESET}"
        exit 1
    }
}

# Function to display a section header
function Show-Section {
    param($Title)
    Write-Host "`n${BOLD}${BLUE}==== $Title ====${RESET}`n"
}

# Check prerequisites
Show-Section "Checking Prerequisites"
Test-Command "node"
Test-Command "npm"
Test-Command "python"
Test-Command "pip"

# Get the Node.js and Python versions
$NODE_VERSION = node -v
$NPM_VERSION = npm -v
$PYTHON_VERSION = python --version

Write-Host "Node.js version: ${GREEN}$NODE_VERSION${RESET}"
Write-Host "npm version: ${GREEN}$NPM_VERSION${RESET}"
Write-Host "Python version: ${GREEN}$PYTHON_VERSION${RESET}"

# Setup backend
function Setup-Backend {
    Show-Section "Setting up Backend"
    Set-Location $BACKEND_DIR
    
    # Check if virtual environment exists
    if (!(Test-Path "venv")) {
        Write-Host "Creating Python virtual environment..."
        python -m venv venv
    }
    
    # Activate virtual environment
    Write-Host "Activating virtual environment..."
    & .\venv\Scripts\Activate.ps1
    
    # Install Python dependencies
    Write-Host "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Deactivate virtual environment
    deactivate
    
    Write-Host "${GREEN}Backend setup completed successfully.${RESET}"
}

# Setup insights processing service
function Setup-Insights {
    Show-Section "Setting up Insights Processing Service"
    Set-Location $INSIGHTS_DIR
    
    # Install Node dependencies
    Write-Host "Installing Node.js dependencies for insights service..."
    npm install
    
    Write-Host "${GREEN}Insights service setup completed successfully.${RESET}"
}

# Setup frontend
function Setup-Frontend {
    Show-Section "Setting up Frontend"
    Set-Location $FRONTEND_DIR
    
    # Install Node dependencies
    Write-Host "Installing Node.js dependencies for frontend..."
    npm install
    
    Write-Host "${GREEN}Frontend setup completed successfully.${RESET}"
}

# Start the backend server in background
function Start-Backend {
    Show-Section "Starting Backend Server"
    Set-Location $BACKEND_DIR
    
    Write-Host "${BOLD}${GREEN}Starting Veritas backend server on port 5000...${RESET}"
    Write-Host "${YELLOW}Backend API will be available at: http://localhost:5000${RESET}"
    Write-Host "${YELLOW}API documentation available at: http://localhost:5000/docs${RESET}"
    
    # Create logs directory if it doesn't exist
    New-Item -ItemType Directory -Force -Path "$PROJECT_ROOT\logs"
    
    # Start the backend in the background
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:BACKEND_DIR
        & .\venv\Scripts\Activate.ps1
        uvicorn main:app --reload --port 5000
    }
    
    # Save job ID
    $backendJob.Id | Out-File "$PROJECT_ROOT\backend.pid"
    Write-Host "${YELLOW}Backend logs will be written to $PROJECT_ROOT\logs\backend.log${RESET}"
    Write-Host "${YELLOW}Backend job ID: $($backendJob.Id)${RESET}"
    
    # Wait for backend to start
    Write-Host "Waiting for backend server to start..."
    Start-Sleep -Seconds 5
}

# Start the insights service in background
function Start-Insights {
    Show-Section "Starting Insights Processing Service"
    Set-Location $INSIGHTS_DIR
    
    Write-Host "${BOLD}${GREEN}Starting Veritas insights processing service on port 5001...${RESET}"
    Write-Host "${YELLOW}Insights API will be available at: http://localhost:5001${RESET}"
    
    # Set environment variables
    $env:SUPABASE_URL = "https://coghrwmmyyzmbnndlawi.supabase.co"
    $env:SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM"
    
    # Start the insights service in the background
    $insightsJob = Start-Job -ScriptBlock {
        Set-Location $using:INSIGHTS_DIR
        node server.js
    }
    
    # Save job ID
    $insightsJob.Id | Out-File "$PROJECT_ROOT\insights.pid"
    Write-Host "${YELLOW}Insights service logs will be written to $PROJECT_ROOT\logs\insights.log${RESET}"
    Write-Host "${YELLOW}Insights service job ID: $($insightsJob.Id)${RESET}"
    
    # Wait for insights service to start
    Write-Host "Waiting for insights service to start..."
    Start-Sleep -Seconds 5
}

# Start the frontend in background
function Start-Frontend {
    Show-Section "Starting Frontend"
    Set-Location $FRONTEND_DIR
    
    Write-Host "${BOLD}${GREEN}Starting Veritas frontend on port 3000...${RESET}"
    Write-Host "${YELLOW}Application will be available at: http://localhost:3000${RESET}"
    
    # Start the frontend in the background
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:FRONTEND_DIR
        $env:PORT = 3000
        npm start
    }
    
    # Save job ID
    $frontendJob.Id | Out-File "$PROJECT_ROOT\frontend.pid"
    Write-Host "${YELLOW}Frontend logs will be written to $PROJECT_ROOT\logs\frontend.log${RESET}"
    Write-Host "${YELLOW}Frontend job ID: $($frontendJob.Id)${RESET}"
    
    # Wait for frontend to start
    Write-Host "Waiting for frontend to start..."
    Start-Sleep -Seconds 8
}

# Open the application in a browser
function Open-Browser {
    Show-Section "Opening Application in Browser"
    Start-Process "http://localhost:3000"
}

# Create a stop script to gracefully kill all processes
function Create-StopScript {
    Show-Section "Creating Stop Script"
    
    $stopScriptContent = @"
# Script to stop all Veritas services
Write-Host "Stopping Veritas services..."

# Kill backend if running
if (Test-Path "$PROJECT_ROOT\backend.pid") {
    `$backendId = Get-Content "$PROJECT_ROOT\backend.pid"
    Stop-Job -Id `$backendId
    Remove-Item "$PROJECT_ROOT\backend.pid"
}

# Kill insights service if running
if (Test-Path "$PROJECT_ROOT\insights.pid") {
    `$insightsId = Get-Content "$PROJECT_ROOT\insights.pid"
    Stop-Job -Id `$insightsId
    Remove-Item "$PROJECT_ROOT\insights.pid"
}

# Kill frontend if running
if (Test-Path "$PROJECT_ROOT\frontend.pid") {
    `$frontendId = Get-Content "$PROJECT_ROOT\frontend.pid"
    Stop-Job -Id `$frontendId
    Remove-Item "$PROJECT_ROOT\frontend.pid"
}

Write-Host "All Veritas services have been stopped."
"@
    
    $stopScriptContent | Out-File "$PROJECT_ROOT\stop.ps1" -Encoding UTF8
    Write-Host "${GREEN}Created stop.ps1 script to gracefully stop all services${RESET}"
}

# Show completion message
function Show-Completion {
    Show-Section "Startup Complete"
    Write-Host "${GREEN}All Veritas components have been started successfully.${RESET}"
    Write-Host ""
    Write-Host "Access the application components at:"
    Write-Host "- ${BLUE}Frontend:${RESET} http://localhost:3000"
    Write-Host "- ${BLUE}Backend API:${RESET} http://localhost:5000"
    Write-Host "- ${BLUE}Insights API:${RESET} http://localhost:5001"
    Write-Host ""
    Write-Host "To view logs:"
    Write-Host "- ${BLUE}Frontend:${RESET} Get-Content $PROJECT_ROOT\logs\frontend.log"
    Write-Host "- ${BLUE}Backend:${RESET} Get-Content $PROJECT_ROOT\logs\backend.log"
    Write-Host "- ${BLUE}Insights:${RESET} Get-Content $PROJECT_ROOT\logs\insights.log"
    Write-Host ""
    Write-Host "To stop all services, run: ${BOLD}.\stop.ps1${RESET}"
    Write-Host ""
    Write-Host "${YELLOW}Enjoy using Veritas Sales Management Platform!${RESET}"
}

# Main execution flow
function Main {
    # Print welcome message
    Write-Host "${BOLD}${GREEN}"
    Write-Host "  _   __           _ _             "
    Write-Host " | | / /          (_) |            "
    Write-Host " | |/ /  ___ _ __  _| |_ __ _ ___  "
    Write-Host " |    \ / _ \ '_ \| | __/ _\` / __| "
    Write-Host " | |\  \  __/ | | | | || (_| \__ \ "
    Write-Host " \_| \_/\___|_| |_|_|\__\__,_|___/ "
    Write-Host "                                   "
    Write-Host "${RESET}"
    Write-Host "${BOLD}Veritas Sales Management Platform - Unified Startup${RESET}"
    Write-Host "This script will start all components of the application."
    Write-Host ""
    
    # Check if any services are already running and stop them
    if (Test-Path "$PROJECT_ROOT\stop.ps1") {
        Write-Host "Stopping any existing services before starting new ones..."
        & "$PROJECT_ROOT\stop.ps1"
        Start-Sleep -Seconds 2
    }
    
    # Setup components
    Setup-Backend
    Setup-Insights
    Setup-Frontend
    
    # Create the stop script
    Create-StopScript
    
    # Start services
    Start-Backend
    Start-Insights
    Start-Frontend
    
    # Open browser
    Open-Browser
    
    # Show completion message
    Show-Completion
    
    # Output a command for viewing logs in real-time
    Write-Host "`n${YELLOW}To view all logs in real-time, run:${RESET}"
    Write-Host "Get-Content $PROJECT_ROOT\logs\*.log -Wait"
}

# Run the main function
Main 