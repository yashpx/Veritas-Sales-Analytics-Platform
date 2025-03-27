#!/usr/bin/env python3
import runpy
import io
import contextlib
import json
import sys
import os

def run_script(module_name):
    """
    Executes a Python module as if it were run as a standalone script.
    Captures and returns stdout output.
    """
    output_buffer = io.StringIO()
    with contextlib.redirect_stdout(output_buffer):
        try:
            # Get the directory of the current script
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Add the current directory to sys.path if it's not already there
            if current_dir not in sys.path:
                sys.path.insert(0, current_dir)
            
            runpy.run_module(module_name, run_name="__main__")
            return output_buffer.getvalue().strip()
        except Exception as e:
            print(f"Error running {module_name}: {e}", file=sys.stderr)
            return "{}"

def parse_json_output(output):
    """Parse JSON output from a script, with fallback for direct JSON strings"""
    try:
        # First try to parse the entire output as JSON
        return json.loads(output)
    except json.JSONDecodeError:
        try:
            # If that fails, try to find and parse just the JSON part
            start = output.find('{')
            end = output.rfind('}') + 1
            if start >= 0 and end > start:
                return json.loads(output[start:end])
        except (json.JSONDecodeError, ValueError):
            pass
    return {}

def get_call_summary():
    """Runs call_summary.py and retrieves the output."""
    try:
        output = run_script("call_summary")
        result = parse_json_output(output)
        # Extract the inner output if it exists
        if isinstance(result, dict) and 'call_summary' in result:
            return result['call_summary']['output']
        return result
    except Exception as e:
        print(f"Error in get_call_summary: {e}", file=sys.stderr)
        # Return a placeholder when the module fails
        return {
            "summary": "Summary not available - Groq API module missing",
            "rating": 0,
            "strengths": ["Not available"],
            "areas_for_improvement": ["Not available"]
        }

def get_custom_rag_analysis():
    """Runs custom_rag.py and retrieves the output."""
    output = run_script("custom_rag")
    result = parse_json_output(output)
    return json.dumps(result)

def get_buyer_intent():
    """Runs buyer_intent.py and retrieves the output."""
    output = run_script("buyer_intent")
    result = parse_json_output(output)
    return json.dumps(result)

def get_profanity_check():
    """Runs detect_profanity.py and retrieves the output."""
    output = run_script("detect_profanity")
    result = parse_json_output(output)
    return json.dumps(result)

def get_analysis():
    """Returns combined analysis results as JSON."""
    # Get the transcript from the diarized-transcript.json file
    transcript_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'diarized-transcript.json')
    transcript = {}
    if os.path.exists(transcript_path):
        try:
            with open(transcript_path, 'r') as f:
                transcript = json.load(f)
        except Exception as e:
            print(f"Error loading transcript: {e}", file=sys.stderr)
    
    # Get analysis results from each module
    call_summary = get_call_summary()
    custom_rag = get_custom_rag_analysis()
    buyer_intent = get_buyer_intent()
    profanity = get_profanity_check()
    
    # Combine results
    analysis = {
        "call_summary": call_summary,
        "custom_rag": custom_rag,
        "buyer_intent": buyer_intent,
        "profanity": profanity,
        "transcript": transcript
    }
    
    return analysis

def main():
    """Main function to print the analysis as JSON."""
    analysis = get_analysis()
    print(json.dumps(analysis, indent=2))

if __name__ == '__main__':
    main()