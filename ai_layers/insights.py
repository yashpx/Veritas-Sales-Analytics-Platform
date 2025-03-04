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
    
    # Save the current working directory
    original_cwd = os.getcwd()
    
    with contextlib.redirect_stdout(output_buffer):
        try:
            # Get the directory of the current script
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Get the parent directory (veritas)
            parent_dir = os.path.dirname(current_dir)
            
            # Change to the parent directory so that the scripts can find the files
            os.chdir(parent_dir)
            
            # Add the parent directory to sys.path if it's not already there
            if parent_dir not in sys.path:
                sys.path.insert(0, parent_dir)
            
            # Run the module with the ai_layers prefix
            runpy.run_module(f"ai_layers.{module_name}", run_name="__main__")
            return output_buffer.getvalue().strip()
        except Exception as e:
            print(f"Error running ai_layers.{module_name}: {e}", file=sys.stderr)
            return "{}"
        finally:
            # Restore the original working directory
            os.chdir(original_cwd)

def parse_json_output(output):
    """Parse JSON output from a script, with fallback for direct JSON strings"""
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        # Try to extract JSON from the output if it's wrapped in other text
        try:
            # Look for the first { and last }
            start = output.find('{')
            end = output.rfind('}') + 1
            if start >= 0 and end > start:
                json_str = output[start:end]
                return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            pass
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
    try:
        call_summary = get_call_summary()
        custom_rag_analysis = get_custom_rag_analysis()
        buyer_intent = get_buyer_intent()
        profanity_check = get_profanity_check()
        
        # Combine all results into a single JSON object
        result = {
            "call_summary": json.loads(call_summary) if call_summary else {},
            "custom_rag_analysis": json.loads(custom_rag_analysis) if custom_rag_analysis else {},
            "buyer_intent": json.loads(buyer_intent) if buyer_intent else {},
            "profanity_check": json.loads(profanity_check) if profanity_check else {}
        }
        
        return json.dumps(result)
    except Exception as e:
        print(f"Error in get_analysis: {e}", file=sys.stderr)
        return "{}"

def main():
    """Main entry point."""
    analysis = get_analysis()
    print(analysis)

if __name__ == '__main__':
    main()