import json
import logging
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch

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

# Function to process the transcript and get buyer intent
def process_intent(file_path):
    """
    Reads a JSON transcript file, extracts messages from Speaker 2, 
    and determines the buyer intent.
    Returns a JSON response with the buyer intent.
    """
    # Open and read the JSON file
    with open(file_path, 'r') as file:
        transcript_data = json.load(file)

    # Extract all Speaker 2 messages
    prospect_messages = [
        message["text"]
        for message in transcript_data["transcript"]
        if message["speaker"] == "Speaker 2"
    ]

    # Combine all prospect messages into one text
    prospect_text = " ".join(prospect_messages)

    # Get intent prediction
    predicted_intent = predict_intent(prospect_text)

    # Construct JSON output in the required format
    result = {"nlp": predicted_intent}

    return result

# Path to the JSON transcript file
transcript_file_path = "diarized-transcript.json"

# Run processing and print output in JSON format
if __name__ == "__main__":
    intent_result = process_intent(transcript_file_path)
    print(json.dumps(intent_result, indent=4))