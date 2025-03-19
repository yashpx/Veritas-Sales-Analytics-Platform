#!/usr/bin/env python3
"""
detect_profanity.py

Reads 'diarized-transcript.json' or fetches transcription data from Supabase
and checks for profanity using a simple word list approach.
Flags any responses containing profanity with 'X' and categorizes severity.

Severity Levels:
1. Clean → No profanity detected.
2. Mild → Minor language (e.g., "hell", "damn").
3. Moderate → Medium severity (e.g., "bastard", "bitch").
4. Severe → Explicit profanity (e.g., "f***", "n*****", "c***").
"""

import json
import re
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import supabase_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_config import get_supabase_client

# Load environment variables
load_dotenv()

# Custom severity levels for different types of words
SEVERITY_LEVELS = {
    'mild': ["damn", "hell", "crap", "stupid", "dumb", "idiot", "piss", "suck"],
    'moderate': ["ass", "bastard", "bitch", "dick", "prick", "whore", "slut"],
    'severe': ["f***", "s***", "c***", "n*****", "motherf***er"]
}

def get_transcript_from_supabase(call_log_id=None):
    """Fetch the transcript from Supabase for the given call_log_id"""
    try:
        # Get the Supabase client
        supabase = get_supabase_client()
        
        # If call_log_id is provided, fetch that specific call log
        if call_log_id:
            response = supabase.table("call_logs").select("*").eq("call_id", call_log_id).execute()
        else:
            # Otherwise, get the most recent call log
            response = supabase.table("call_logs").select("*").order("call_date", desc=True).limit(1).execute()
        
        # Check if we got any data
        if response.data:
            call_log = response.data[0]
            # Return the transcriptions field
            return call_log.get("transcriptions")
        
        return None
    except Exception as e:
        print(f"Error fetching transcript from Supabase: {e}")
        return None

def load_transcript(file_path: str) -> dict:
    """
    Loads the JSON file containing the diarized transcript.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def detect_profanity(text: str) -> (str, list):
    """
    Detects the severity level of profanity in a given text.
    Returns a tuple of severity and a list of detected words.
    """
    words = re.findall(r'\b\w+\b', text.lower())
    detected_words = []

    for level, word_list in SEVERITY_LEVELS.items():
        if any(word in words for word in word_list):
            detected_words.extend([word for word in words if word in word_list])
            return level, detected_words  # Return the first matched level

    return "clean", []

def analyze_transcript(transcript_data: dict) -> dict:
    """
    Analyzes the transcript for profanity and returns flagged lines.
    """
    flagged_transcript = []
    detected_profanities = []
    severity_counts = {"mild": 0, "moderate": 0, "severe": 0}

    # Handle different transcript formats
    transcript_entries = []
    if isinstance(transcript_data, dict):
        if "transcript" in transcript_data:
            transcript_entries = transcript_data.get("transcript", [])
        elif "conversation" in transcript_data:
            transcript_entries = transcript_data.get("conversation", [])

    for entry in transcript_entries:
        speaker = entry.get("speaker", "Unknown Speaker")
        text = entry.get("text", "")

        severity, detected_words = detect_profanity(text)

        if severity != "clean":
            severity_counts[severity] += 1
            detected_profanities.extend(detected_words)
            flagged_transcript.append(f"{speaker}: {text} ❌")
        else:
            flagged_transcript.append(f"{speaker}: {text}")

    # Determine the overall severity level
    if severity_counts["severe"] > 0:
        overall_severity = "Severe ❌"
    elif severity_counts["moderate"] > 0:
        overall_severity = "Moderate ❗"
    elif severity_counts["mild"] > 0:
        overall_severity = "Mild ⚠️"
    else:
        overall_severity = "Clean ✅"

    return {
        "severity level": overall_severity,
        "flagged_transcript": flagged_transcript,
        "detected_profanities": list(set(detected_profanities))  # Unique words only
    }

def main():
    """Runs the profanity detection pipeline and prints JSON output."""
    # Check if a call_log_id was provided via environment variable
    call_log_id = os.getenv("CALL_LOG_ID")
    
    # Get the transcript data
    transcript_data = None
    if call_log_id:
        print(f"Analyzing call log ID: {call_log_id}")
        transcript_data = get_transcript_from_supabase(call_log_id)
    
    # Default file path if needed
    json_file_path = os.getenv('TRANSCRIPT_FILE_PATH', 'diarized-transcript.json')
    
    # Load transcript
    if transcript_data:
        # Use the data from Supabase
        pass
    elif os.path.exists(json_file_path):
        # Load from file if Supabase data not available
        transcript_data = load_transcript(json_file_path)
    else:
        print(f"Error: No transcript data available")
        return

    # Run profanity detection
    results = analyze_transcript(transcript_data)

    # Build the JSON output in the desired format
    output = {
        "severity level": results["severity level"]
    }
    if results["detected_profanities"]:
        output["report"] = "Profanity detected."
        output["flagged_transcript"] = results["flagged_transcript"]
        output["detected_profanities"] = results["detected_profanities"]
    else:
        output["report"] = "No profanity detected."
    
    # Wrap the output in the JSON structure expected by React:
    # {
    #     "profanity_check": {
    #         "output": "<stringified JSON of output>"
    #     }
    # }
    final_output = {
        "profanity_check": {
            "output": json.dumps(output, ensure_ascii=False)
        }
    }
    # Print the JSON output
    print(json.dumps(final_output, indent=2))

if __name__ == "__main__":
    main()