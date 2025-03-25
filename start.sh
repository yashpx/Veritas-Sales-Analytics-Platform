#!/bin/bash

# Veritas Sales Management Platform - Unified Startup Script
# This script starts all components of the application in a single command

# Text formatting
BOLD="\e[1m"
GREEN="\e[32m"
BLUE="\e[34m"
YELLOW="\e[33m"
RED="\e[31m"
RESET="\e[0m"

# Set the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
INSIGHTS_DIR="$PROJECT_ROOT/insightspg"

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it and try again.${RESET}"
        exit 1
    fi
}

# Function to display a section header
section() {
    echo -e "\n${BOLD}${BLUE}==== $1 ====${RESET}\n"
}

# Check prerequisites
section "Checking Prerequisites"
check_command node
check_command npm
check_command python3
check_command pip

# Get the Node.js and Python versions
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
PYTHON_VERSION=$(python3 --version)

echo -e "Node.js version: ${GREEN}$NODE_VERSION${RESET}"
echo -e "npm version: ${GREEN}$NPM_VERSION${RESET}"
echo -e "Python version: ${GREEN}$PYTHON_VERSION${RESET}"

# Setup backend
setup_backend() {
    section "Setting up Backend"
    cd "$BACKEND_DIR"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    echo "Activating virtual environment..."
    source venv/bin/activate
    
    # Install Python dependencies
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Deactivate virtual environment (will be reactivated when starting the server)
    deactivate
    
    echo -e "${GREEN}Backend setup completed successfully.${RESET}"
}

# Setup insights processing service
setup_insights() {
    section "Setting up Insights Processing Service"
    cd "$INSIGHTS_DIR"
    
    # Install Node dependencies
    echo "Installing Node.js dependencies for insights service..."
    npm install
    
    # Make start script executable
    chmod +x start_insightspg.sh
    
    echo -e "${GREEN}Insights service setup completed successfully.${RESET}"
}

# Setup frontend
setup_frontend() {
    section "Setting up Frontend"
    cd "$FRONTEND_DIR"
    
    # Install Node dependencies
    echo "Installing Node.js dependencies for frontend..."
    npm install
    
    echo -e "${GREEN}Frontend setup completed successfully.${RESET}"
}

# Start the backend server in background
start_backend() {
    section "Starting Backend Server"
    cd "$BACKEND_DIR"
    
    echo -e "${BOLD}${GREEN}Starting Veritas backend server on port 5000...${RESET}"
    echo -e "${YELLOW}Backend API will be available at: http://localhost:5000${RESET}"
    echo -e "${YELLOW}API documentation available at: http://localhost:5000/docs${RESET}"
    
    # Start the backend in the background and save PID
    mkdir -p "$PROJECT_ROOT/logs"
    (cd "$BACKEND_DIR" && source venv/bin/activate && uvicorn main:app --reload --port 5000 > "$PROJECT_ROOT/logs/backend.log" 2>&1) &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/backend.pid"
    echo -e "${YELLOW}Backend logs will be written to $PROJECT_ROOT/logs/backend.log${RESET}"
    echo -e "${YELLOW}Backend process ID: $BACKEND_PID${RESET}"
    
    # Wait for backend to start
    echo "Waiting for backend server to start..."
    sleep 5
}

# Start the insights service in background
start_insights() {
    section "Starting Insights Processing Service"
    cd "$INSIGHTS_DIR"
    
    echo -e "${BOLD}${GREEN}Starting Veritas insights processing service on port 5001...${RESET}"
    echo -e "${YELLOW}Insights API will be available at: http://localhost:5001${RESET}"
    
    # Set environment variables needed for the insights service
    export SUPABASE_URL="https://coghrwmmyyzmbnndlawi.supabase.co"
    export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM"
    
    # Start the insights service in the background and save PID
    mkdir -p "$PROJECT_ROOT/logs"
    (cd "$INSIGHTS_DIR" && node server.js > "$PROJECT_ROOT/logs/insights.log" 2>&1) &
    INSIGHTS_PID=$!
    echo $INSIGHTS_PID > "$PROJECT_ROOT/insights.pid"
    echo -e "${YELLOW}Insights service logs will be written to $PROJECT_ROOT/logs/insights.log${RESET}"
    echo -e "${YELLOW}Insights service process ID: $INSIGHTS_PID${RESET}"
    
    # Wait for insights service to start
    echo "Waiting for insights service to start..."
    sleep 5
}

# Start the frontend in background
start_frontend() {
    section "Starting Frontend"
    cd "$FRONTEND_DIR"
    
    echo -e "${BOLD}${GREEN}Starting Veritas frontend on port 3000...${RESET}"
    echo -e "${YELLOW}Application will be available at: http://localhost:3000${RESET}"
    
    # Start the frontend in the background and save PID
    mkdir -p "$PROJECT_ROOT/logs"
    # Use PORT env var to ensure we start on 3000
    (cd "$FRONTEND_DIR" && PORT=3000 npm start > "$PROJECT_ROOT/logs/frontend.log" 2>&1) &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/frontend.pid"
    echo -e "${YELLOW}Frontend logs will be written to $PROJECT_ROOT/logs/frontend.log${RESET}"
    echo -e "${YELLOW}Frontend process ID: $FRONTEND_PID${RESET}"
    
    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    sleep 8
}

# Open the application in a browser
open_browser() {
    section "Opening Application in Browser"
    
    # Check which browser command to use
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    elif command -v start &> /dev/null; then
        start http://localhost:3000
    else
        echo -e "${YELLOW}Warning: Could not find a command to open the browser.${RESET}"
        echo -e "Please manually open ${BLUE}http://localhost:3000${RESET} in your browser."
    fi
}

# Add a stop script to gracefully kill all processes
create_stop_script() {
    section "Creating Stop Script"
    
    # Create a stop script that will kill all the background processes
    cat > "$PROJECT_ROOT/stop.sh" << EOF
#!/bin/bash
# Script to stop all Veritas services

echo "Stopping Veritas services..."

# Kill backend if running
if [ -f "$PROJECT_ROOT/backend.pid" ]; then
    BACKEND_PID=\$(cat "$PROJECT_ROOT/backend.pid")
    if ps -p \$BACKEND_PID > /dev/null; then
        echo "Stopping Backend server (PID: \$BACKEND_PID)..."
        kill \$BACKEND_PID
    fi
    rm "$PROJECT_ROOT/backend.pid"
fi

# Kill insights service if running
if [ -f "$PROJECT_ROOT/insights.pid" ]; then
    INSIGHTS_PID=\$(cat "$PROJECT_ROOT/insights.pid")
    if ps -p \$INSIGHTS_PID > /dev/null; then
        echo "Stopping Insights service (PID: \$INSIGHTS_PID)..."
        kill \$INSIGHTS_PID
    fi
    rm "$PROJECT_ROOT/insights.pid"
fi

# Kill frontend if running
if [ -f "$PROJECT_ROOT/frontend.pid" ]; then
    FRONTEND_PID=\$(cat "$PROJECT_ROOT/frontend.pid")
    if ps -p \$FRONTEND_PID > /dev/null; then
        echo "Stopping Frontend server (PID: \$FRONTEND_PID)..."
        kill \$FRONTEND_PID
    fi
    rm "$PROJECT_ROOT/frontend.pid"
fi

echo "All Veritas services have been stopped."
EOF
    
    chmod +x "$PROJECT_ROOT/stop.sh"
    echo -e "${GREEN}Created stop.sh script to gracefully stop all services${RESET}"
}

# Show completion message
show_completion() {
    section "Startup Complete"
    echo -e "${GREEN}All Veritas components have been started successfully.${RESET}"
    echo -e ""
    echo -e "Access the application components at:"
    echo -e "- ${BLUE}Frontend:${RESET} http://localhost:3000"
    echo -e "- ${BLUE}Backend API:${RESET} http://localhost:5000"
    echo -e "- ${BLUE}Insights API:${RESET} http://localhost:5001"
    echo -e ""
    echo -e "To view logs:"
    echo -e "- ${BLUE}Frontend:${RESET} cat $PROJECT_ROOT/logs/frontend.log"
    echo -e "- ${BLUE}Backend:${RESET} cat $PROJECT_ROOT/logs/backend.log"
    echo -e "- ${BLUE}Insights:${RESET} cat $PROJECT_ROOT/logs/insights.log"
    echo -e ""
    echo -e "To stop all services, run: ${BOLD}./stop.sh${RESET}"
    echo -e ""
    echo -e "${YELLOW}Enjoy using Veritas Sales Management Platform!${RESET}"
}

# Main execution flow
main() {
    # Print welcome message
    echo -e "${BOLD}${GREEN}"
    echo "  _   __           _ _             "
    echo " | | / /          (_) |            "
    echo " | |/ /  ___ _ __  _| |_ __ _ ___  "
    echo " |    \\ / _ \\ '_ \\| | __/ _\` / __| "
    echo " | |\\  \\  __/ | | | | || (_| \\__ \\ "
    echo " \\_| \\_/\\___|_| |_|_|\\__\\__,_|___/ "
    echo "                                   "
    echo -e "${RESET}"
    echo -e "${BOLD}Veritas Sales Management Platform - Unified Startup${RESET}"
    echo -e "This script will start all components of the application."
    echo ""
    
    # Check if any services are already running and stop them
    if [ -f "$PROJECT_ROOT/stop.sh" ]; then
        echo "Stopping any existing services before starting new ones..."
        $PROJECT_ROOT/stop.sh
        sleep 2
    fi
    
    # Setup components
    setup_backend
    setup_insights
    setup_frontend
    
    # Create the stop script to gracefully kill processes
    create_stop_script
    
    # Start services
    start_backend
    start_insights
    start_frontend
    
    # Open browser
    open_browser
    
    # Show completion message
    show_completion
    
    # Output a tail command for viewing logs in real-time
    echo -e "\n${YELLOW}To view all logs in real-time, run:${RESET}"
    echo -e "tail -f $PROJECT_ROOT/logs/*.log"
}

# Run the main function
main