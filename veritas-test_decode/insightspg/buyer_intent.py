import json
import logging
import os
import sys
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch

# Add parent directory to path to import supabase_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_config import get_supabase_client

# Suppress transformer warnings
logging.getLogger("transformers").setLevel(logging.ERROR)

# Define the intent labels
intent_labels = [
    "Highly Interested", 
    "Interested", 
    "Disinterested", 
    "Highly Disinterested", 
    "Neutral"
]

# Your Hugging Face model
model_name = "nigelnoronha/BERT-buyer-intent"

# Load the model and tokenizer once
model = AutoModelForSequenceClassification.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Function to predict intent based on the conversation
def predict_intent(conversation):
    # Tokenize the conversation
    inputs = tokenizer(conversation, return_tensors="pt", padding=True, truncation=True, max_length=512)
    
    # Get model predictions
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Apply softmax to get probabilities
    logits = outputs.logits
    probabilities = torch.softmax(logits, dim=-1)
    
    # Get the predicted class (index of the highest probability)
    predicted_class_idx = torch.argmax(probabilities, dim=-1)
    
    # Map the predicted class index to the intent label
    predicted_intent = intent_labels[predicted_class_idx.item()]
    
    return predicted_intent

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

# Function to process the transcript and get buyer intent
def process_intent(transcript_data=None, file_path=None):
    """
    Process transcript data or read from a file, extract messages from Speaker 2, 
    and determine the buyer intent.
    Returns a JSON response with the buyer intent.
    """
    # If transcript_data is not provided, try to read from file
    if transcript_data is None and file_path:
        try:
            print(f"Reading transcript from file: {file_path}")
            with open(file_path, 'r') as file:
                transcript_data = json.load(file)
                print(f"Successfully loaded transcript from file")
        except Exception as e:
            print(f"Error reading file: {e}")
            return {"error": str(e)}
    
    if not transcript_data:
        print("No transcript data available")
        return {"error": "No transcript data available"}
    
    try:
        # Extract all Speaker 2 messages
        prospect_messages = []
        
        # Parse transcript_data if it's a string
        if isinstance(transcript_data, str):
            try:
                print("Parsing transcript data from string")
                transcript_data = json.loads(transcript_data)
                print("Successfully parsed transcript data")
            except json.JSONDecodeError as e:
                print(f"Error parsing transcript data: {e}")
                return {"error": "Invalid transcript format"}
        
        print(f"Processing transcript data of type: {type(transcript_data)}")
        
        # Handle different transcript formats
        if isinstance(transcript_data, dict):
            print(f"Transcript data keys: {transcript_data.keys()}")
            if "transcript" in transcript_data:
                print(f"Found 'transcript' key with {len(transcript_data['transcript'])} items")
                prospect_messages = [
                    message["text"]
                    for message in transcript_data["transcript"]
                    if message["speaker"] == "Speaker 2"
                ]
            elif "conversation" in transcript_data:
                print(f"Found 'conversation' key with {len(transcript_data['conversation'])} items")
                prospect_messages = [
                    message["text"]
                    for message in transcript_data["conversation"]
                    if message["speaker"] == "Speaker 2"
                ]
        elif isinstance(transcript_data, list):
            # Direct list of messages
            print(f"Transcript data is a list with {len(transcript_data)} items")
            prospect_messages = [
                message["text"]
                for message in transcript_data
                if isinstance(message, dict) and 
                   "speaker" in message and 
                   "text" in message and 
                   message["speaker"] == "Speaker 2"
            ]
        
        print(f"Found {len(prospect_messages)} prospect messages")
        
        if not prospect_messages:
            print("No prospect messages found in transcript")
            return {"error": "No prospect messages found in transcript"}
        
        # Combine all messages into a single text
        prospect_text = " ".join(prospect_messages)
        print(f"Combined prospect text (first 100 chars): {prospect_text[:100]}...")
        
        # Get the buyer intent
        intent = predict_intent(prospect_text)
        print(f"Predicted intent: {intent}")
        
        return {"nlp": intent}
    
    except Exception as e:
        print(f"Error processing intent: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

def main():
    """Main function to run the intent analysis"""
    # Check if a call_log_id was provided via environment variable
    call_log_id = os.getenv("CALL_LOG_ID")
    
    # Get transcript data
    transcript_data = None
    if call_log_id:
        print(f"Fetching transcript for call log ID: {call_log_id}")
        transcript_data = get_transcript_from_supabase(call_log_id)
        print(f"Transcript data type: {type(transcript_data)}")
        if isinstance(transcript_data, dict):
            print(f"Transcript data keys: {transcript_data.keys()}")
        elif isinstance(transcript_data, list):
            print(f"Transcript data is a list with {len(transcript_data)} items")
            if transcript_data and isinstance(transcript_data[0], dict):
                print(f"First item keys: {transcript_data[0].keys()}")
    
    # If no transcript data from Supabase, try local file
    if not transcript_data:
        # First check for TRANSCRIPT_FILE, then fall back to TRANSCRIPT_FILE_PATH
        transcript_file_path = os.getenv('TRANSCRIPT_FILE') or os.getenv('TRANSCRIPT_FILE_PATH', 'diarized-transcript.json')
        print(f"Using local transcript file: {transcript_file_path}")
        
        # Check if the file exists
        if os.path.exists(transcript_file_path):
            print(f"Transcript file exists at: {transcript_file_path}")
        else:
            print(f"Transcript file does not exist at: {transcript_file_path}")
            # Try to find the file in the current directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            alt_path = os.path.join(current_dir, '..', os.path.basename(transcript_file_path))
            if os.path.exists(alt_path):
                print(f"Found transcript file at alternate path: {alt_path}")
                transcript_file_path = alt_path
            else:
                print(f"Error: Could not find transcript file at any location", file=sys.stderr)
                sys.exit(1)
        
        intent_result = process_intent(file_path=transcript_file_path)
    else:
        print("Using transcript data from Supabase")
        intent_result = process_intent(transcript_data=transcript_data)
    
    # Wrap the result in the format expected by insights.py
    wrapped_result = {
        "buyer_intent": {
            "output": json.dumps(intent_result)
        }
    }
    
    # Print the result as JSON
    print(json.dumps(wrapped_result, indent=4))

# Run processing and print output in JSON format
if __name__ == "__main__":
    main()