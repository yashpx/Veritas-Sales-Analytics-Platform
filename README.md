# Veritas - Sales Management Platform

A comprehensive sales management platform that enables sales teams to manage calls, analyze conversations, and track performance metrics. Built with React, FastAPI, Supabase, and integrated with AI services.

## User logins

```
Sales rep login:
email: Charliebrown@veritas.com
password: password123

Manager login:
email: akhilanil.100@gmail.com
password: 123456

Alternatively, you can create your own account for Manager, all the existing data for the default organization will load for the same manager.

```

## Quick Start Guide

We provide unified startup scripts for different operating systems. Choose the appropriate one based on your system:

### For Windows Users
```powershell
# Run the application using PowerShell
.\start.ps1
```

### For Linux/macOS Users
```bash
# Make the script executable (one-time setup)
chmod +x start.sh

# Run the application
./start.sh
```

These scripts will automatically:
1. Install all required dependencies for both frontend and backend
2. Set up the Python virtual environment
3. Start the backend FastAPI server on port 5000
4. Start the insights processing service on port 5001
5. Launch the React frontend development server on port 3000
6. Open the application in your default browser

### Prerequisites
Before running the startup script, ensure you have these installed:
- Node.js (v14+)
- npm
- Python 3.8+
- A modern web browser

### Access the Application
Once the startup script has completed, you can access:
- Main Application: http://localhost:3000
- Backend API: http://localhost:5000
- Insights API: http://localhost:5001

### Troubleshooting

If you encounter any issues with the startup scripts:

1. Check the console output for specific error messages
2. Verify that all prerequisite software is installed
3. Try manually starting each component following the instructions below
4. Ensure that ports 3000, 5000, and 5001 are not already in use by other applications

#### Common Issues

##### Missing Dependencies
If you see errors about missing Python modules:
```
ModuleNotFoundError: No module named 'pydantic_core'
```
The application is designed to continue functioning with fallback mechanisms. However, you can try installing the specific dependencies:
```bash
pip install pydantic==1.10.8  # Use an older version compatible with more systems
```

##### Port Conflicts
If you see errors about ports already in use:

For Windows:
```powershell
# Find the process
netstat -ano | findstr :5001
# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

For Linux/macOS:
```bash
# Find the process
lsof -i :5001
# Kill the process
kill -9 <PID>
```

### Manual Start Reference
If the automated scripts don't work, you can manually start each component using these commands:

![Run code reference](Run%20code.png)



### Prerequisites
- Node.js (v14+)
- npm or yarn
- Python 3.8+
- Supabase account
- Groq API key (for transcription features)
- Twilio account (for calling features)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. The `.env` file is already set up with your Supabase credentials.

5. Start the backend server:
   ```
   uvicorn main:app --reload --port 5000
   ```

### Insights Processing Service Setup

1. Navigate to the insightspg directory:
   ```
   cd insightspg
   ```

2. Install Node dependencies:
   ```
   npm install
   ```

3. Make the startup script executable:
   ```
   chmod +x start_insightspg.sh
   ```

4. Start the insights service:
   ```
   ./start_insightspg.sh
   ```

This service runs on port 5001 and processes call transcriptions to generate insights.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` with your credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_GROQ_API_KEY=your_groq_api_key
   REACT_APP_TWILIO_ACCOUNT_SID=your_twilio_account_sid
   REACT_APP_TWILIO_AUTH_TOKEN=your_twilio_auth_token
   REACT_APP_INSIGHTS_API_URL=http://localhost:5001
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Supabase Setup

1. Create a new Supabase project
2. Set up the following tables:
   - users (handled by Supabase Auth)
   - call_logs
   - call_transcriptions
   - call_insights
   - customers
   - sales_reps
   - sales_data
3. Enable Row Level Security (RLS) policies
4. Set up authentication providers as needed


## Features

### Core Sales Management
- Make and receive calls directly from the application
- Record sales conversations automatically
- Transcribe call recordings with speaker diarization
- Generate AI insights from conversation content
- Track call logs and customer interactions
- Monitor KPI metrics for sales performance

### Call Analysis & Insights
- Advanced call transcription with speaker identification
- Conversation analytics powered by Groq API
- Detailed insights including call summaries, ratings, and recommendations
- Buyer intent detection and objection tracking
- Conversation quality metrics and improvement suggestions
- Benchmark comparisons against best practices

### Authentication System
- User registration with email and password
- Secure login and authentication
- JWT-based authentication
- Password reset functionality
- Session management
- Protected routes for authenticated users
- Sales representative management

### Dashboard & Analytics
- Sales KPI dashboard with real-time metrics
- Interactive charts and visualizations
- Call tracking and management
- Customer relationship management
- Sales rep performance monitoring
- Team management tools for sales managers
- Notifications system

### Technical Features
- Responsive design for all devices
- Modular component architecture
- Dark mode support
- RESTful API integration with Supabase
- Lazy-loaded routes for optimal performance
- Centralized state management with React Context
- Error handling and validation
- AI-powered audio transcription using Groq API
- Call functionality through Twilio integration
- Microservice architecture with dedicated insights processing service

## Technology Stack

### Frontend
- React 18
- React Router 6
- Material UI
- Recharts for data visualization
- Supabase JS client
- Axios for API requests
- Groq API for AI audio transcription
- Twilio SDK for calling functionality

### Backend
- Python 3.8+
- FastAPI
- Pydantic for data validation
- Supabase Python Client
- Pytest for testing

### Insights Processing
- Node.js Express server
- Python analysis modules
- Groq API for AI analysis
- Supabase for data storage and retrieval
- Custom RAG (Retrieval Augmented Generation) implementation

### DevOps
- GitHub for version control
- Environment variables for configuration
- Node.js and npm for package management

## Usage

### Calling Features
- Make outbound calls using the DialPad
- Record calls automatically for later analysis
- View call history with timestamps and duration
- Access call transcriptions and insights

### Call Analysis
- Upload or record call recordings
- Process audio to generate transcriptions with speaker diarization
- Analyze conversation for key insights and action items
- Track follow-up tasks from call content
- View synchronized transcripts with audio playback
- Get AI-powered conversation quality metrics and recommendations

### Dashboard
- View KPIs and metrics on the main dashboard
- Monitor team performance metrics
- Navigate through different sections using the sidebar
- Interact with charts and tables to filter data
- Access detailed reports in the Analytics section

### Team Management
- Manage sales representatives
- Set goals and track performance
- Identify coaching opportunities through call insights
- Monitor team activity and customer interactions

### Administration
- Manage user profiles in the Settings page
- Update notification preferences
- Configure display settings

## Security Notes

- The frontend uses only the anon key for Supabase operations
- The backend can use the service role key for admin operations
- Environment variables are properly separated
- JWT tokens are handled securely
- CORS is properly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Supabase](https://supabase.io/) for the authentication and database services
- [FastAPI](https://fastapi.tiangolo.com/) for the fast and modern backend framework
- [React](https://reactjs.org/) for the frontend library
- [Material UI](https://mui.com/) for the UI components
- [Recharts](https://recharts.org/) for the charting library
- [Groq API](https://groq.com/) for the AI transcription and diarization services
- [Twilio](https://www.twilio.com/) for the calling functionality
