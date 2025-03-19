import os
import json
import groq
import sys
from dotenv import load_dotenv

# Add parent directory to path to import supabase_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_config import get_supabase_client

# Load environment variables
load_dotenv()

# Initialize Groq client
client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))

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
            # Try different possible column names for transcriptions
            transcript = call_log.get("transcription") or call_log.get("transcript") or call_log.get("transcriptions")
            
            if transcript:
                # If transcript is a string, try to parse it as JSON
                if isinstance(transcript, str):
                    try:
                        parsed_transcript = json.loads(transcript)
                        return parsed_transcript
                    except json.JSONDecodeError:
                        # If it's not valid JSON, return it as is
                        return transcript
                return transcript
            
            # If no transcript field found, check if there's a JSON string that needs parsing
            for key, value in call_log.items():
                if isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                    try:
                        parsed = json.loads(value)
                        if isinstance(parsed, dict) and ('transcript' in parsed or 'conversation' in parsed):
                            return parsed
                    except:
                        pass
        
        print("No transcript found in Supabase, falling back to local file")
        return None
    except Exception as e:
        print(f"Error fetching transcript from Supabase: {e}")
        return None

def convert_transcript_to_text(transcript_data):
    """Convert transcript data to plain text for analysis"""
    text = ""
    
    # Handle different transcript formats
    if isinstance(transcript_data, dict):
        if "transcript" in transcript_data:
            for entry in transcript_data["transcript"]:
                text += f"{entry['speaker']}: {entry['text']}\n"
        elif "conversation" in transcript_data:
            for entry in transcript_data["conversation"]:
                text += f"{entry['speaker']}: {entry['text']}\n"
    
    return text

def generate_summary(transcript_data=None, transcript_file_path=None):
    """Generate a summary of the sales call transcript using Groq."""
    
    transcript_text = ""
    
    # First try to use the provided transcript data
    if transcript_data:
        transcript_text = convert_transcript_to_text(transcript_data)
    # If no transcript data provided, try to read from file
    elif transcript_file_path:
        try:
            with open(transcript_file_path, 'r') as file:
                transcript_data = json.load(file)
                transcript_text = convert_transcript_to_text(transcript_data)
        except Exception as e:
            print(f"Error reading transcript file: {e}")
            return {"error": f"Failed to read transcript file: {str(e)}"}
    
    if not transcript_text:
        return {"error": "No transcript data available"}

    # Create the prompt for Groq
    prompt = f"""Analyze this sales call transcript and provide:
1. A concise summary of the key points (2-3 sentences)
2. An overall call rating out of 100
3. A list of 3-5 key strengths demonstrated in the call
4. A list of 3-5 specific areas for improvement

Here's the transcript:
{transcript_text}

Format your response in this exact JSON structure:
{{
    "summary": "your summary here",
    "rating": numeric_rating,
    "strengths": [
        "strength 1",
        "strength 2",
        "strength 3"
    ],
    "areas_for_improvement": [
        "improvement 1",
        "improvement 2",
        "improvement 3"
    ]
}}"""

    # Call Groq API
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are an expert sales coach analyzing sales call transcripts."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="llama3-70b-8192"
    )
    
    # Extract the response
    response_text = chat_completion.choices[0].message.content
    
    # Parse the JSON response
    try:
        # Try to extract JSON from the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            result = json.loads(json_str)
            return result
        else:
            return {"error": "Could not find valid JSON in the response"}
    
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON response", "raw_response": response_text}

def main():
    """Main function to run the summary generation."""
    # Check if a call_log_id was provided via environment variable
    call_log_id = os.getenv("CALL_LOG_ID")
    
    # Get transcript data
    transcript_data = None
    if call_log_id:
        print(f"Fetching transcript for call log ID: {call_log_id}")
        transcript_data = get_transcript_from_supabase(call_log_id)
    
    # If no transcript data from Supabase, try local file
    if not transcript_data:
        # First check for TRANSCRIPT_FILE, then fall back to TRANSCRIPT_FILE_PATH
        transcript_file_path = os.getenv('TRANSCRIPT_FILE') or os.getenv('TRANSCRIPT_FILE_PATH', 'diarized-transcript.json')
        print(f"Using local transcript file: {transcript_file_path}")
        
        # Verify the file exists
        if not os.path.exists(transcript_file_path):
            print(f"Error: Transcript file does not exist: {transcript_file_path}", file=sys.stderr)
            sys.exit(1)
            
        result = generate_summary(transcript_file_path=transcript_file_path)
    else:
        print("Using transcript data from Supabase")
        result = generate_summary(transcript_data=transcript_data)
    
    # Wrap the result in the format expected by React:
    wrapped_result = {
        "call_summary": {
            "output": json.dumps(result)
        }
    }
    
    # Print the final JSON result
    print(json.dumps(wrapped_result, indent=4))

if __name__ == "__main__":
    main()