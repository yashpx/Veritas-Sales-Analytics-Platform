#!/bin/bash
# Script to stop all Veritas services

echo "Stopping Veritas services..."

# Kill backend if running
if [ -f "/home/ubuntu/projects/veritas-authentication/backend.pid" ]; then
    BACKEND_PID=$(cat "/home/ubuntu/projects/veritas-authentication/backend.pid")
    if ps -p $BACKEND_PID > /dev/null; then
        echo "Stopping Backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    rm "/home/ubuntu/projects/veritas-authentication/backend.pid"
fi

# Kill insights service if running
if [ -f "/home/ubuntu/projects/veritas-authentication/insights.pid" ]; then
    INSIGHTS_PID=$(cat "/home/ubuntu/projects/veritas-authentication/insights.pid")
    if ps -p $INSIGHTS_PID > /dev/null; then
        echo "Stopping Insights service (PID: $INSIGHTS_PID)..."
        kill $INSIGHTS_PID
    fi
    rm "/home/ubuntu/projects/veritas-authentication/insights.pid"
fi

# Kill frontend if running
if [ -f "/home/ubuntu/projects/veritas-authentication/frontend.pid" ]; then
    FRONTEND_PID=$(cat "/home/ubuntu/projects/veritas-authentication/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "Stopping Frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    rm "/home/ubuntu/projects/veritas-authentication/frontend.pid"
fi

echo "All Veritas services have been stopped."
