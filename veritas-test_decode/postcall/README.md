# Post-Call Analysis App

A React and Flask application for analyzing sales call transcripts and providing insights.

## Project Structure

```
postcall/
├── backend/
│   ├── post_call_analysis.py   # Flask backend server
│   └── requirements.txt        # Python dependencies
└── frontend/
    ├── src/
    │   ├── App.jsx            # Main React component
    │   └── App.css            # Styles
    └── package.json           # Node.js dependencies
```

## Setup & Running

### Backend Setup
1. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Set up your environment variables in `.env`:
   ```
   GROQ_API_KEY=your_api_key_here
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

1. Start the Flask backend server:
   ```bash
   # From the backend directory
   python post_call_analysis.py
   ```
   The backend will run on http://localhost:5001

2. In a separate terminal, start the React frontend:
   ```bash
   # From the frontend directory
   npm start
   ```
   The frontend will run on http://localhost:3000

Visit http://localhost:3000 in your browser to use the application.

## Features

- Real-time call analysis using Groq AI
- Call rating visualization
- Key discussion points summary
- Strengths and areas for improvement
- Action buttons for follow-up tasks
- Clean, modern UI design
