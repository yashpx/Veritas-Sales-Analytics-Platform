# Veritas - Sales Management Platform

A comprehensive sales management platform that enables sales teams to manage calls, analyze conversations, and track performance metrics. Built with React, FastAPI, Supabase, and integrated with AI services.

## Features

### Core Sales Management
- Make and receive calls directly from the application
- Record sales conversations automatically
- Transcribe call recordings with speaker diarization
- Generate AI insights from conversation content
- Track call logs and customer interactions
- Monitor KPI metrics for sales performance

### Authentication System
- User registration with email and password
- Secure login and authentication
- JWT-based authentication
- Password reset functionality
- Session management
- Protected routes for authenticated users

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

## Project Structure

```
veritas/
├── backend/                # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── auth/           # Authentication logic
│   │   ├── models/         # Pydantic models
│   │   └── utils/          # Utility functions
│   ├── config/             # Configuration settings
│   ├── .env                # Environment variables (not in git)
│   ├── .env.example        # Example environment variables
│   ├── main.py             # FastAPI entry point
│   └── requirements.txt    # Python dependencies
│
└── frontend/               # React frontend
    ├── public/             # Static files
    ├── src/
    │   ├── components/     # Reusable components
    │   │   ├── auth/       # Authentication components
    │   │   ├── layout/     # Layout components
    │   │   └── ui/         # UI components
    │   ├── context/        # React context (auth)
    │   ├── pages/          # Page components
    │   ├── styles/         # Global styles
    │   ├── utils/          # Utility functions
    │   ├── App.js          # Main application component
    │   └── index.js        # React entry point
    └── package.json        # NPM dependencies
```

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

### DevOps
- GitHub for version control
- Environment variables for configuration
- Node.js and npm for package management

## Getting Started

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