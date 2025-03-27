import os
import json
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    Use the Groq client with model llama3-70b-8192 to predict buyer intent
    from the provided conversation text.
    """
    try:
        # Try to import groq module
        import groq
        # Initialize Groq client
        client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))
        
        # Build a prompt that instructs the model to classify buyer intent
        prompt = (
            f"Given the following conversation, classify the buyer's intent "
            f"into one of these categories: {', '.join(intent_labels)}.\n\n"
            f"Conversation:\n{conversation}\n\n"
            f"Buyer Intent:"
        )
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at analyzing sales conversations and determining buyer intent."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-70b-8192",
            temperature=0.0,
            max_tokens=20,
            stream=False
        )
        
        # Extract the response
        predicted_intent = chat_completion.choices[0].message.content.strip()
        return predicted_intent
    
    except ImportError:
        # If groq module is not available, return a fallback response
        print("Error: groq module not installed", file=sys.stderr)
        return "Not available - missing Groq API"
    except Exception as e:
        # Handle any other exceptions
        print(f"Error in predict_intent_groq: {str(e)}", file=sys.stderr)
        return f"Error determining intent: {str(e)}"

def process_intent(file_path):
    """
    Reads a JSON transcript file, extracts the full conversation,
    and determines the buyer intent using the Groq model.
    Returns a JSON response with the buyer intent.
    """
    try:
        # Read the transcript file
        with open(file_path, 'r') as f:
            transcript = json.load(f)
        
        # Extract the conversation text
        conversation = ""
        for segment in transcript.get('segments', []):
            speaker = segment.get('speaker', 'Unknown')
            text = segment.get('text', '')
            conversation += f"{speaker}: {text}\n"
        
        # Predict the buyer intent
        intent = predict_intent_groq(conversation)
        
        # Return the result as a dictionary
        return {
            "buyer_intent": intent,
            "confidence": 0.85 if intent not in ["Not available - missing Groq API", "Error determining intent"] else 0.0
        }
    
    except Exception as e:
        print(f"Error in process_intent: {str(e)}", file=sys.stderr)
        return {
            "buyer_intent": "Error processing intent",
            "confidence": 0.0
        }

# Path to the JSON transcript file
transcript_file_path = "diarized-transcript.json"

# Run processing and print output in JSON format
result = process_intent(transcript_file_path)
print(json.dumps(result, indent=2))