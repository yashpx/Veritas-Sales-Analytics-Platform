# Veritas Setup Guide

This guide provides simple instructions to get the Veritas Sales Management Platform up and running quickly.

## Quick Start (All-in-One Script)

For the easiest setup experience, we've provided a unified startup script that will launch all components of the application in a single command:

```bash
# Make the script executable (one-time setup)
chmod +x start.sh

# Run the application
./start.sh
```

This script will automatically:
1. Install all required dependencies for both frontend and backend
2. Set up the Python virtual environment
3. Start the backend FastAPI server on port 5000
4. Start the insights processing service on port 5001
5. Launch the React frontend development server on port 3000
6. Open the application in your default browser

## Access the Application

Once the startup script has completed, you can access:

- Main Application: http://localhost:3000
- Backend API: http://localhost:5000
- Insights API: http://localhost:5001

## Prerequisites

The startup script assumes you have these installed:
- Node.js (v14+)
- npm
- Python 3.8+
- A modern web browser

## Cross-Platform Support

The Veritas platform now includes enhanced compatibility for both Ubuntu-based systems and macOS:

- **macOS Users**: The application has been updated to handle dependency differences on macOS, particularly with modules like pydantic-core.
- **Dependency Management**: The insights service will gracefully handle missing dependencies and provide fallback responses.
- **Error Handling**: Improved error handling ensures the application continues to function even when specific modules are unavailable.

## Manual Setup

If you prefer to set up each component manually, or if you're encountering issues with the unified script, please follow the detailed instructions in the [README.md](./README.md) file under the "Getting Started" section.

## Environment Variables

For the application to function correctly, you need to have these environment variables:

- Supabase credentials (already configured)
- Groq API key (for call insights)
- Twilio credentials (for call functionality)

The README provides more details on setting up these environment variables.

## Troubleshooting

If you encounter any issues with the startup script:

1. Check the console output for specific error messages
2. Verify that all prerequisite software is installed
3. Try manually starting each component following the instructions in README.md
4. Ensure that ports 3000, 5000, and 5001 are not already in use by other applications

### Common Issues

#### Missing Dependencies
If you see errors about missing Python modules:
```
ModuleNotFoundError: No module named 'pydantic_core'
```
The application is designed to continue functioning with fallback mechanisms. However, you can try installing the specific dependencies:
```bash
pip install pydantic==1.10.8  # Use an older version compatible with more systems
```

#### Port Conflicts
If you see errors about ports already in use:
```
Error: listen EADDRINUSE: address already in use :::5001
```
You can find and stop the process using that port:
```bash
# Find the process
lsof -i :5001
# Kill the process
kill -9 <PID>
```

For persistent issues, please check the GitHub repository issues or contact the development team.