# Veritas - Sales Management Platform

A comprehensive sales management platform that enables sales teams to manage calls, analyze conversations, and track performance metrics. Built with React, FastAPI, Supabase, and integrated with AI services.

The source code for this project can be found at - https://github.com/adakidpv/veritas
Since it contains environment variables, the repo is private, so Professor Haitham has been added as a collaborator (https://github.com/drhyaish). 

The landing page for this website is deployed at - https://veritas-uowd.tiiny.site/#

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

Once the application starts, open your browser and go to http://localhost:3000

## Testing Guide for Professor

### Step 1: Sign Up as a Sales Representative
1. Click the "Sign Up" button on the login page
2. Fill in your details:
   - Email: (use your email)
   - Password: (create a secure password)
   - Role: Select "Sales Representative"
3. Click "Sign Up"

### Step 2: Testing Call Analysis Features
1. After logging in, you'll see the main dashboard
2. Click on "Call Analysis" in the sidebar
3. To test the transcription and insights features:
   - Click "Upload Call Recording"
   - Navigate to the `audio_files` folder in the project
   - Select "Call 1 Charlie Brown.m4a"
   - Click "Upload"
4. The system will:
   - Transcribe the call with speaker identification
   - Generate AI insights about the conversation
   - Provide a detailed analysis of the call

### Step 3: Viewing Call Insights
1. Once the analysis is complete, you'll see:
   - A transcript of the call with speaker labels
   - Key insights and takeaways
   - Call quality metrics
   - Recommendations for improvement
2. You can:
   - Play the audio while following the transcript
   - Review the AI-generated insights
   - See the conversation quality score

### Step 4: Testing Manager View
1. Sign out of your sales representative account
2. Create a new account:
   - Click "Sign Up"
   - Use a different email
   - Select "Manager" as the role
3. After logging in as a manager, you'll see:
   - A dashboard with team performance metrics
   - Access to all sales representatives' calls
   - Team-wide analytics and insights
4. You can:
   - View all team members' calls
   - Access individual performance metrics
   - Generate team reports

### Key Features to Test

#### As a Sales Representative:
- Call recording upload and analysis
- Personal call history
- Individual performance metrics
- Call insights and recommendations

#### As a Manager:
- Team performance dashboard
- Individual rep performance tracking
- Call quality monitoring
- Team analytics and reporting

## Troubleshooting

If you encounter any issues:

1. Make sure all three services are running:
   - Frontend (http://localhost:3000)
   - Backend API (http://localhost:5000)
   - Insights API (http://localhost:5001)

2. If you see any errors:
   - Check the browser console for specific messages
   - Ensure you're using a modern web browser
   - Try refreshing the page

3. For port conflicts:
   - Windows: Use `netstat -ano | findstr :5001` to find and close conflicting processes
   - Linux/macOS: Use `lsof -i :5001` to find and close conflicting processes

## Need Help?

If you encounter any issues or need assistance:
1. Check the browser console for error messages
2. Ensure all services are running properly
3. Try refreshing the page
4. Contact the development team for support

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
