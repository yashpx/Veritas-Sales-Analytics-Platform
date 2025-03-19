# Sales Call Analysis Platform

## System Architecture

The application consists of several Python modules that work together to analyze sales call transcripts:

### Backend Components

1. `insights.py` - Main Flask Server
   - Acts as the central coordinator for all analysis components
   - Provides the `/api/output` endpoint that returns combined analysis
   - Orchestrates the execution of all other analysis modules
   - Handles CORS and API responses

2. `call_summary.py` - Call Analysis
   - Generates concise summaries of sales calls
   - Uses Groq AI to analyze transcripts
   - Provides call rating percentages
   - Identifies key strengths and areas for improvement

3. `custom_rag.py` - Custom Retrieval Analysis
   - Performs detailed analysis of specific sections
   - Extracts relevant information using RAG techniques
   - Provides context-aware insights

4. `buyer_intent.py` - Buyer Intent Analysis
   - Analyzes buyer's purchasing signals
   - Identifies potential objections
   - Evaluates engagement level

5. `detect_profanity.py` - Content Moderation
   - Scans transcripts for inappropriate content
   - Provides content safety metrics

When `insights.py` receives a request:
1. It executes each analysis module sequentially
2. Combines their outputs into a single JSON response
3. Sends the comprehensive analysis back to the frontend

## Setup & Running

### Backend Setup
1. Make sure you have Python 3.8+ installed
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your environment variables in `.env`:
   - `GROQ_API_KEY`: Your Groq API key

### Frontend Setup
1. Make sure you have Node.js installed
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the Flask backend server:
   ```bash
   # From the root directory (insightspg)
   python insights.py
   ```
   The backend will run on http://localhost:5001

2. In a separate terminal, start the React frontend:
   ```bash
   # From the frontend directory
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:3000

Visit http://localhost:3000 in your browser to use the application.

## Automated Pipeline for Real-time Analysis

The system includes an automated pipeline that processes new call logs as they are added to Supabase:

### Components

1. **Webhook Server** (`webhook_server.py`)
   - Listens for Supabase webhook events
   - Triggers analysis when new call logs are added
   - Stores generated insights back to Supabase

2. **Express Server** (`server.js`)
   - Processes API requests
   - Executes Python analysis scripts
   - Returns insights data

### Setup Instructions

1. **Configure Supabase**
   - In your Supabase project, go to Database → Webhooks
   - Create a new webhook with the following settings:
     - Name: `call_logs_webhook`
     - Table: `call_logs`
     - Events: `INSERT`
     - HTTP Method: `POST`
     - URL: `https://your-server-url/webhook` (use ngrok for local testing)
     - Secret: Generate a secure secret and add it to your `.env` file as `SUPABASE_WEBHOOK_SECRET`

2. **Update Database Schema**
   - Ensure your `call_logs` table has the following columns:
     - `insights` (JSONB): Stores the generated insights
     - `processed_at` (TIMESTAMP): Records when the insights were generated

3. **Start the Services**
   - Run `./start_services.sh` to start both the Express and webhook servers
   - To stop the services, run `./stop_services.sh`

4. **For Production Deployment**
   - Use the provided systemd service files:
     - `insightspg-webhook.service`
     - `insightspg-express.service`
   - Copy these files to `/etc/systemd/system/`
   - Enable and start the services:
     ```bash
     sudo systemctl enable insightspg-webhook.service
     sudo systemctl start insightspg-webhook.service
     sudo systemctl enable insightspg-express.service
     sudo systemctl start insightspg-express.service
     ```

### Testing the Pipeline

1. Add a new row to the `call_logs` table in Supabase
2. The webhook server will receive the event and trigger the analysis
3. The generated insights will be stored back in the `insights` column
4. Check the logs in `webhook.log` and `express.log` for details
