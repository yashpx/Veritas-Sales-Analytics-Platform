#!/bin/bash

# Set environment variables from .env file if it exists
if [ -f "../.env" ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' ../.env | xargs)
fi

# Check if webhook server is running
WEBHOOK_RUNNING=$(pgrep -f "uvicorn webhook_server:app" || echo "")
if [ -z "$WEBHOOK_RUNNING" ]; then
  echo "Warning: Webhook server is not running. Transcription updates won't trigger insights processing."
  echo "Consider starting the webhook server with: ./start_webhook_server.sh"
  echo ""
  
  # Ask if user wants to continue without webhook server
  read -p "Do you want to continue without the webhook server? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "Exiting. Please start the webhook server first."
    exit 1
  fi
else
  echo "Webhook server is running. Transcription updates will trigger insights processing."
fi

# Start the Express server
echo "Starting Express server..."
node server.js &
EXPRESS_PID=$!

# Wait for the Express server to start
sleep 2
echo "Express server started on http://localhost:5001"

# Navigate to the frontend directory
cd frontend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing React app dependencies..."
  npm install
fi

# Start the React app
echo "Starting React app..."
npm start &
REACT_PID=$!

# Function to handle cleanup
function cleanup {
  echo "Stopping servers..."
  kill $EXPRESS_PID
  kill $REACT_PID
  exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT

echo "Both servers are running."
echo "Express API: http://localhost:5001"
echo "React App: http://localhost:3000"
echo "Press Ctrl+C to stop both servers."

# Open browser automatically
sleep 3
echo "Opening React app in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open http://localhost:3000
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  start http://localhost:3000
fi

# Wait for user to press Ctrl+C
wait
