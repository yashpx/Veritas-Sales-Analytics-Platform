# Supabase Authentication Demo - Professional Version

This project demonstrates a professional-grade authentication system using Supabase, with a React frontend and Python (FastAPI) backend.

## Project Structure

```
authenticate/
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
    │   ├── context/        # React context (auth)
    │   ├── pages/          # Page components
    │   ├── utils/          # Utility functions
    │   ├── App.js          # Main application component
    │   └── index.js        # React entry point
    └── package.json        # NPM dependencies
```

## Features

- User registration with email and password
- User login and authentication
- JWT-based authentication
- Protected routes for authenticated users
- User profile and information display
- Responsive design
- Error handling and validation
- Session management
- Centralized state management with React Context

## Tech Stack

### Frontend
- React
- React Router
- Supabase JS Client
- CSS3

### Backend
- Python 3.8+
- FastAPI
- Pydantic
- Supabase Python Client

## Getting Started

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- npm or yarn
- A Supabase account and project

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

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Security Notes

- The frontend uses only the anon key for Supabase operations
- The backend can use the service role key for admin operations
- Environment variables are properly separated
- JWT tokens are handled securely
- CORS is properly configured

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Supabase](https://supabase.io/) for the authentication and database services
- [FastAPI](https://fastapi.tiangolo.com/) for the fast and modern backend framework
- [React](https://reactjs.org/) for the frontend library