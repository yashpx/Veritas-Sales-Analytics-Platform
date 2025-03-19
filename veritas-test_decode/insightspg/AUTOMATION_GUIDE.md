# InsightsPG Automation Guide

This guide provides detailed instructions on how to set up and maintain the automated pipeline for real-time call insights generation.

## Overview

The automated pipeline consists of the following components:

1. **Supabase Database**: Stores call logs and generated insights
2. **Webhook Server**: Listens for new call log events from Supabase
3. **Express Server**: Processes analysis requests and generates insights
4. **Analysis Scripts**: Python scripts that analyze call transcripts

When a new call log is added to the Supabase database, a webhook event is triggered, which is received by the webhook server. The webhook server then triggers the Express server to generate insights, which are stored back in the Supabase database.

## Key Files and Their Roles

### Core Files (Use These)

1. **Database Schema Management**:
   - `add_insights_column.py` - Script to add necessary columns to the database
   - `add_insights_column.sql` - SQL script defining the schema changes

2. **Main Processing Scripts**:
   - `check_call_logs_columns.py` - Core script that handles retrieving call logs and processing insights
   - `insightspg/insights.py` - Main orchestration script that runs the analysis pipeline

3. **Analysis Modules**:
   - `insightspg/buyer_intent.py` - Analyzes buyer intent from call transcripts
   - `insightspg/call_summary.py` - Generates call summaries
   - `insightspg/custom_rag.py` - Performs custom RAG (Retrieval-Augmented Generation) analysis
   - `insightspg/detect_profanity.py` - Checks for profanity in call transcripts

4. **API Server**:
   - `insightspg/server.js` - Express server that provides API endpoints for the frontend

5. **Verification/Monitoring**:
   - `check_call_logs_insights.py` - Script to check if insights were stored in the database

### Files to Avoid

1. **Legacy or Deprecated Files**:
   - Any Python scripts in the root directory that duplicate functionality in the `insightspg` folder
   - Older versions of analysis scripts that may exist in backup folders

2. **Development/Testing Files**:
   - Files with `_test` or `_dev` suffixes
   - Sample transcript files (except when needed for testing)

## How the Pipeline Works

### Data Flow

1. **Input**: Call logs with transcriptions are stored in the Supabase database
2. **Trigger**: Either:
   - Automatic: A webhook event is triggered when a new call log is added
   - Manual: The `/api/process-insights` endpoint is called with a specific call log ID
3. **Processing**:
   - `server.js` receives the request and calls `check_call_logs_columns.py` with the `--get-insights` flag
   - `check_call_logs_columns.py` retrieves the call log and extracts the transcription
   - The transcription is passed to `insights.py` which orchestrates the analysis
   - Each analysis module (`call_summary.py`, `custom_rag.py`, etc.) processes the transcription
4. **Output**: The combined results are stored in the `insights` column of the call log in the database

### Technical Implementation Details

- **Transcription Format**: The system expects transcriptions in JSON format with speaker diarization
- **Error Handling**: Failed analyses are logged but don't prevent other analyses from completing
- **Performance**: The pipeline is designed to process a call log in under 60 seconds
- **Concurrency**: The system can handle multiple simultaneous requests

## Setup Instructions

### 1. Update Database Schema

First, ensure your Supabase database has the necessary columns to store the generated insights:

```bash
# Run the schema update script
python add_insights_column.py
```

This will add the following columns to the `call_logs` table:
- `insights` (JSONB): Stores the generated insights
- `processed_at` (TIMESTAMP): Records when the insights were generated

### 2. Configure Supabase Webhook

In your Supabase dashboard:

1. Go to **Database → Webhooks**
2. Click **Create a new webhook**
3. Configure the webhook with the following settings:
   - **Name**: `call_logs_webhook`
   - **Table**: `call_logs`
   - **Events**: `INSERT`
   - **HTTP Method**: `POST`
   - **URL**: Your webhook server URL (e.g., `https://your-server.com/webhook`)
   - **Secret**: Generate a secure secret

4. Copy the generated secret and add it to your `.env` file:
   ```
   SUPABASE_WEBHOOK_SECRET=your_generated_secret
   ```

### 3. Make Your Webhook Server Publicly Accessible

For Supabase to send webhook events to your server, it needs to be publicly accessible. You can use:

- **For Production**: A cloud server with a public IP and domain
- **For Testing**: [ngrok](https://ngrok.com/) to create a secure tunnel to your local server

```bash
# Using ngrok for testing
ngrok http 5001
```

Use the generated ngrok URL in your Supabase webhook configuration.

### 4. Start the Express Server

```bash
# Navigate to the insightspg directory
cd insightspg

# Install dependencies
npm install

# Start the server
node server.js
```

For production deployment, consider using a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start the server with PM2
pm2 start server.js --name "insights-server"

# Ensure it starts on system boot
pm2 startup
pm2 save
```

## Testing the Pipeline

### Manual Testing

1. Start the Express server:
   ```bash
   cd insightspg
   node server.js
   ```

2. Send a request to process insights for a specific call log:
   ```bash
   curl -X POST http://localhost:5001/api/process-insights \
     -H "Content-Type: application/json" \
     -d '{"callLogId": 123}'
   ```

3. Verify that the insights were stored in the database:
   ```bash
   python check_call_logs_insights.py
   ```

### Automated Testing

1. Add a new row to the `call_logs` table in Supabase with a transcription
2. The webhook should automatically trigger the insights processing
3. Check the Express server logs for processing information
4. Verify that the insights were stored in the database

## Troubleshooting

### Webhook Not Receiving Events

1. Check that your webhook server is publicly accessible
2. Verify the webhook URL in Supabase is correct
3. Check the webhook secret matches the one in your `.env` file
4. Look for any errors in the webhook server logs

### Insights Not Being Generated

1. Check that the Express server is running
2. Verify that the webhook server can connect to the Express server
3. Check for any errors in the Express server logs
4. Ensure the Python analysis scripts are working correctly

### Insights Not Being Stored

1. Check that the Supabase client is configured correctly
2. Verify that the `insights` and `processed_at` columns exist in the `call_logs` table
3. Look for any errors in the webhook server logs related to updating the database

## Maintenance

### Updating the Analysis Modules

If you need to update or improve the analysis modules:

1. Make changes to the relevant Python script in the `insightspg` directory
2. Test the changes by manually triggering the insights processing
3. Deploy the changes to production

### Monitoring

For production deployments, consider setting up monitoring for the services:

1. Check the logs regularly:
   ```bash
   tail -f insightspg/server.log
   ```

2. Monitor the database for unprocessed call logs:
   ```sql
   SELECT COUNT(*) FROM call_logs WHERE processed_at IS NULL;
   ```

3. Set up alerts for service failures and long processing times
