from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
import sys

# Add the parent directory to sys.path to import from ai_layers
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import from ai_layers
from ai_layers.post_call_analysis import analyze_with_groq

# Import the call insights functions
from check_call_logs_columns import get_call_insights, process_call_insights

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

# Define the directory where transcript files are stored
TRANSCRIPT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '')

@app.route('/api/transcripts', methods=['GET'])
def list_transcripts():
    """API endpoint that returns only the diarized-transcript.json file."""
    transcript_files = []
    
    # Only include the diarized-transcript.json file from the root directory
    file_path = os.path.join(TRANSCRIPT_DIR, 'diarized-transcript.json')
    if os.path.exists(file_path):
        transcript_files.append({
            'id': 'diarized-transcript.json',
            'name': 'diarized-transcript.json',
            'path': 'diarized-transcript.json'
        })
    
    return jsonify(transcript_files)

@app.route('/api/transcripts/<path:transcript_id>', methods=['GET'])
def get_transcript(transcript_id):
    """API endpoint that returns the content of a specific transcript file."""
    file_path = os.path.join(TRANSCRIPT_DIR, transcript_id)
    
    if not os.path.exists(file_path):
        return jsonify({"error": f"Transcript file not found: {transcript_id}"}), 404
    
    try:
        with open(file_path, 'r') as f:
            transcript_data = json.load(f)
        return jsonify(transcript_data)
    except Exception as e:
        return jsonify({"error": f"Failed to read transcript file: {str(e)}"}), 500

@app.route('/api/analyze', methods=['POST'])  
def analyze_call():
    """API endpoint that returns the call analysis."""
    transcript = request.json.get('transcript', '')
    transcript_id = request.json.get('transcript_id', '')
    
    # If transcript_id is provided, load the transcript from the file
    if transcript_id and not transcript:
        file_path = os.path.join(TRANSCRIPT_DIR, transcript_id)
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    transcript_data = json.load(f)
                    # Extract the transcript text based on the file format
                    if 'transcript' in transcript_data and isinstance(transcript_data['transcript'], list):
                        # Format for diarized transcript
                        transcript = '\n'.join([f"[{item['speaker']}]: {item['text']}" for item in transcript_data['transcript']])
                    else:
                        # Fallback to using the raw JSON
                        transcript = json.dumps(transcript_data)
            except Exception as e:
                return jsonify({"error": f"Failed to read transcript file: {str(e)}"}), 500
    
    if not transcript:
        return jsonify({"error": "No transcript provided"}), 400
    
    try:
        analysis_result = analyze_with_groq(transcript)
        return jsonify(analysis_result)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/call-insights/<call_id>', methods=['GET'])
def get_call_insights_endpoint(call_id):
    """API endpoint that returns insights for a specific call log."""
    try:
        # Get insights for the call log
        insights = get_call_insights(call_id)
        
        if insights:
            return jsonify(insights)
        else:
            return jsonify({"error": f"No insights found for call log: {call_id}"}), 404
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/process-insights/<call_id>', methods=['POST'])
def process_call_insights_endpoint(call_id):
    """API endpoint that processes insights for a specific call log."""
    try:
        result = process_call_insights(call_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)
