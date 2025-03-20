import os
import json
import groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Groq client
client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))

# Define the intent labels
intent_labels = [
    "Highly Interested", 
    "Interested", 
    "Disinterested", 
    "Highly Disinterested", 
    "Neutral"
]

def predict_intent_groq(conversation):
    """
    Use the Groq client with model llama3-70b-819 to predict buyer intent
    from the provided conversation text.
    """
    # Build a prompt that instructs the model to classify buyer intent
    prompt = (
        f"Given the following conversation, classify the buyer's intent "
        f"into one of these categories: {', '.join(intent_labels)}.\n\n"
        f"Conversation:\n{conversation}\n\n"
        f"Buyer Intent:"
    )
    
    # Query the Groq API using the specified model.
    response = client.query(
        model="llama3-70b-819",
        prompt=prompt,
        max_tokens=20,
        temperature=0.0,
    )
    
    # Extract and clean the response text.
    predicted_intent = response["text"].strip()
    return predicted_intent

def process_intent(file_path):
    """
    Reads a JSON transcript file, extracts the full conversation,
    and determines the buyer intent using the Groq model.
    Returns a JSON response with the buyer intent.
    """
    # Open and read the JSON file
    with open(file_path, 'r') as file:
        transcript_data = json.load(file)
    
    # Extract the full conversation with speaker labels
    conversation = ""
    for message in transcript_data["transcript"]:
        speaker = message["speaker"]
        text = message["text"]
        conversation += f"{speaker}: {text}\n"
    
    # Get intent prediction using Groq
    predicted_intent = predict_intent_groq(conversation)
    
    # Construct JSON output in the required format
    result = {"nlp": predicted_intent}
    return result

# Path to the JSON transcript file
transcript_file_path = "diarized-transcript.json"

# Run processing and print output in JSON format
if __name__ == "__main__":
    intent_result = process_intent(transcript_file_path)
    print(json.dumps(intent_result, indent=4))