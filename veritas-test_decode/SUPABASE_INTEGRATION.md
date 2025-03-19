# Supabase Integration for Veritas

This document explains how to set up and use the Supabase integration for the Veritas project.

## Overview

The Supabase integration allows you to automatically trigger the insights.py script whenever a new row with transcription data is added to the `call_logs` table in your Supabase database. The analysis results are then saved back to Supabase in the `call_analysis` table.

## Setup Instructions

### 1. Set up environment variables

Create or update your `.env` file with the following variables:

```
SUPABASE_URL=https://coghrwmmyyzmbnndlawi.supabase.co
SUPABASE_KEY=your_supabase_key_here
WEBHOOK_SECRET=your_webhook_secret_here
```

Replace `your_supabase_key_here` with your actual Supabase key.

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set up Supabase tables and webhook

Run the setup script:

```bash
python setup_supabase.py https://your-webhook-url.com/webhook
```

Replace `https://your-webhook-url.com/webhook` with the URL where your webhook server will be running.

### 4. Start the webhook server

```bash
python webhook_server.py
```

By default, the server runs on port 8000. You can change this by setting the `PORT` environment variable.

## How It Works

1. When a new row is added to the `call_logs` table in Supabase with transcription data, a webhook is triggered.
2. The webhook sends a POST request to your webhook server.
3. The webhook server receives the request and extracts the call log ID.
4. The server runs the `insights.py` script with the call log ID.
5. The script analyzes the transcription data and saves the results back to Supabase in the `call_analysis` table.

## Testing

You can test the integration by adding a new row to the `call_logs` table in Supabase with transcription data:

```sql
INSERT INTO call_logs (caller_id, callee_id, call_duration, transcription)
VALUES ('caller123', 'callee456', 300, 'This is a test transcription.');
```

## Troubleshooting

- **Webhook not triggering**: Make sure your webhook URL is accessible from the internet. You may need to use a service like ngrok to expose your local server.
- **Script not running**: Check the logs of the webhook server for any errors.
- **Results not saving to Supabase**: Make sure your Supabase key has the necessary permissions to write to the `call_analysis` table.

## Exposing Your Local Server

To expose your local webhook server to the internet, you can use ngrok:

```bash
ngrok http 8000
```

This will give you a public URL that you can use as your webhook URL.
