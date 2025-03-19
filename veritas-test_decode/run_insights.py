#!/usr/bin/env python3
"""
Script to run insights.py with a specific transcript file.
"""
import os
import json
import sys
import subprocess
import argparse

def run_insights(transcript_file):
    """Run insights.py with a specific transcript file."""
    # Get absolute path for the transcript file
    transcript_file = os.path.abspath(transcript_file)
    print(f"Using transcript file: {transcript_file}")
    
    # Verify the file exists
    if not os.path.exists(transcript_file):
        print(f"Error: Transcript file does not exist: {transcript_file}", file=sys.stderr)
        return None
    
    # Get the path to the insights.py script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    insights_script_path = os.path.join(current_dir, "insightspg", "insights.py")
    print(f"Using insights script: {insights_script_path}")
    
    # Run the insights.py script
    env = {**os.environ, "TRANSCRIPT_FILE": transcript_file}
    print(f"Environment variables: TRANSCRIPT_FILE={transcript_file}")
    
    result = subprocess.run(
        [sys.executable, insights_script_path],
        capture_output=True,
        text=True,
        env=env
    )
    
    if result.returncode != 0:
        print(f"Error running insights.py: {result.stderr}", file=sys.stderr)
        return None
    
    # Print the raw output for debugging
    print(f"Raw output from insights.py:\n{result.stdout}")
    
    # Parse the insights output
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"Error parsing insights output: {result.stdout}", file=sys.stderr)
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run insights.py with a specific transcript file')
    parser.add_argument('transcript_file', help='Path to the transcript file')
    
    args = parser.parse_args()
    
    result = run_insights(args.transcript_file)
    if result:
        print(json.dumps(result, indent=2))
