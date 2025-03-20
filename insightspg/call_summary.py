import os
import json
import groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Groq client
client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))

def generate_summary(transcript_file_path):
    """Generate a summary of the sales call transcript using Groq."""
    
    # Read the transcript
    with open(transcript_file_path, 'r') as file:
        transcript = file.read()

    # Create the prompt for Groq
    prompt = f"""Analyze this sales call transcript and provide:
1. A concise summary of the key points (2-3 sentences)
2. An overall call rating out of 100
3. A list of 3-5 key strengths demonstrated in the call
4. A list of 3-5 specific areas for improvement

Here's the transcript:
{transcript}

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
        model="mixtral-8x7b-32768",
        temperature=0.7,
        max_tokens=1000
    )

    # Get the response
    response = chat_completion.choices[0].message.content

    try:
        # Parse the JSON response
        result = json.loads(response)
        
        # Ensure all required fields are present
        required_fields = ['summary', 'rating', 'strengths', 'areas_for_improvement']
        for field in required_fields:
            if field not in result:
                result[field] = [] if field in ['strengths', 'areas_for_improvement'] else ''
                
        # Format strengths and areas for improvement as bullet points
        result['strengths'] = '\n• ' + '\n• '.join(result['strengths'])
        result['areas_for_improvement'] = '\n• ' + '\n• '.join(result['areas_for_improvement'])
        
        return result

    except json.JSONDecodeError:
        return {
            'summary': 'Error parsing response',
            'rating': 0,
            'strengths': '',
            'areas_for_improvement': ''
        }

def main():
    """Main function to run the summary generation."""
    # Get the transcript file path from environment
    transcript_file_path = os.getenv('TRANSCRIPT_FILE_PATH', 'diarized-transcript.json')
    
    # Generate the summary
    result = generate_summary(transcript_file_path)
    
    # Wrap the result in the format expected by React:
    # {
    #   "call_summary": {
    #       "output": "<stringified JSON of result>"
    #   }
    # }
    wrapped_result = {
        "call_summary": {
            "output": json.dumps(result)
        }
    }
    
    # Print the final JSON result
    print(json.dumps(wrapped_result, indent=4))

if __name__ == "__main__":
    main()