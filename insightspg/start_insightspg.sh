#!/bin/bash

# Script to start the insights.py server
# Make sure this file is executable (chmod +x start_insightspg.sh)

echo "Starting Veritas Insights Server..."

# Set environment variables if needed
export SUPABASE_URL="https://coghrwmmyyzmbnndlawi.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM"

# Start the Node.js Express server
node server.js