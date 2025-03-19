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
            
            # Set the TRANSCRIPT_FILE environment variable for the script if provided
            transcript_file = os.environ.get('TRANSCRIPT_FILE')
            if transcript_file:
                os.environ['TRANSCRIPT_FILE'] = transcript_file
                print(f"Using transcript file from environment: {transcript_file}")
            else:
                # Default to diarized-transcript.json in the parent directory
                default_file = os.path.join(os.path.dirname(current_dir), 'diarized-transcript.json')
                os.environ['TRANSCRIPT_FILE'] = default_file
                print(f"Using default transcript file: {default_file}")
            
            runpy.run_module(module_name, run_name="__main__")
            return output_buffer.getvalue().strip()
        except Exception as e:
            print(f"Error running {module_name}: {e}", file=sys.stderr)
            return "{}"

def parse_json_output(output):
    """Parse JSON output from a script, with fallback for direct JSON strings"""
    try:
        # First try to parse the entire output as JSON
        print(f"Trying to parse output: {output}")
        return json.loads(output)
    except json.JSONDecodeError:
        try:
            # If that fails, try to find and parse just the JSON part
            start = output.find('{')
            end = output.rfind('}') + 1
            if start >= 0 and end > start:
                json_part = output[start:end]
                print(f"Extracted JSON part: {json_part}")
                return json.loads(json_part)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing JSON: {e}")
    return {}

def get_call_summary():
    """Runs call_summary.py and retrieves the output."""
    output = run_script("call_summary")
    result = parse_json_output(output)
    # Extract the inner output if it exists
    if isinstance(result, dict) and 'call_summary' in result:
        return result['call_summary']['output']
    return json.dumps(result)

def get_custom_rag_analysis():
    """Runs custom_rag.py and retrieves the output."""
    output = run_script("custom_rag")
    result = parse_json_output(output)
    
    # Check if the result is already in the expected format
    if "custom_rag_analysis" in result and "output" in result["custom_rag_analysis"]:
        # Extract the inner content to avoid double-wrapping
        try:
            inner_content = json.loads(result["custom_rag_analysis"]["output"])
            return json.dumps(inner_content)
        except json.JSONDecodeError:
            # If we can't parse the inner content, return it as is
            return result["custom_rag_analysis"]["output"]
    
    # If not in the expected format, return as is
    return json.dumps(result)

def get_buyer_intent():
    """Runs buyer_intent.py and retrieves the output."""
    output = run_script("buyer_intent")
    print(f"Raw buyer_intent output: {output}")
    
    # Find the last JSON object in the output
    last_json_start = output.rfind('{')
    last_json_end = output.rfind('}') + 1
    
    if last_json_start >= 0 and last_json_end > last_json_start:
        try:
            json_str = output[last_json_start:last_json_end]
            print(f"Extracted JSON: {json_str}")
            result = json.loads(json_str)
            print(f"Parsed result: {result}")
            return json.dumps(result)
        except json.JSONDecodeError as e:
            print(f"Error parsing buyer intent JSON: {e}")
    
    # Fallback to the regular parsing method
    result = parse_json_output(output)
    return json.dumps(result)

def get_profanity_check():
    """Runs detect_profanity.py and retrieves the output."""
    output = run_script("detect_profanity")
    result = parse_json_output(output)
    return json.dumps(result)

def get_analysis():
    """Returns combined analysis results as JSON."""
    try:
        # Print the transcript file path if provided
        transcript_file = os.environ.get('TRANSCRIPT_FILE')
        if transcript_file:
            print(f"Using transcript file: {transcript_file}")
            
            # Verify the file exists
            if not os.path.exists(transcript_file):
                print(f"Error: Transcript file does not exist: {transcript_file}", file=sys.stderr)
                return {"error": f"Transcript file does not exist: {transcript_file}"}
        
        results = {
            "call_summary": {
                "output": get_call_summary()
            },
            "custom_rag_analysis": {
                "output": get_custom_rag_analysis()
            },
            "buyer_intent": {
                "output": get_buyer_intent()
            },
            "profanity_check": {
                "output": get_profanity_check()
            }
        }
        return results
    except Exception as e:
        print(f"Error in get_analysis: {e}", file=sys.stderr)
        return {"error": str(e)}

def main():
    # Output the JSON directly to stdout
    results = get_analysis()
    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()