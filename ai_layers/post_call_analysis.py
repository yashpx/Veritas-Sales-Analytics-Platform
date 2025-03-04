import os
import groq
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Groq client
groq_client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))

def analyze_with_groq(transcript):
    """Analyze the call transcript using Groq."""
    prompt = f"""
    Analyze this sales call transcript and provide these 4 insights in JSON format:
    1. Recommended Next Step: What's the immediate follow-up action with specific timing
    2. Key Objection: The main resistance point from the prospect
    3. Key Turning Point: The moment when engagement or interest peaked
    4. Outcome: The final result of the call

    Transcript:
    {transcript}

    Return ONLY valid JSON in this exact format without any additional text or formatting:
    {{
        "nextStep": {{
            "action": "...",
            "details": "...",
            "timing": "...",
            "additionalInfo": "..."
        }},
        "keyObjection": {{
            "issue": "...",
            "context": "..."
        }},
        "keyTurningPoint": {{
            "action": "...",
            "context": "..."
        }},
        "outcome": {{
            "status": "...",
            "type": "..."
        }}
    }}
    """

    # Call Groq API
    response = groq_client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": prompt
        }],
        model="mixtral-8x7b-32768",
        temperature=0.1,
        max_tokens=500,
        top_p=1,
        stop=None
    )

    # Get the response content and clean it
    content = response.choices[0].message.content.strip()
    
    # If the response starts with ```json and ends with ```, remove them
    if content.startswith('```json'):
        content = content[7:]
    if content.startswith('```'):
        content = content[3:]
    if content.endswith('```'):
        content = content[:-3]
    
    content = content.strip()
    
    try:
        analysis = json.loads(content)
        return analysis
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {content}")
        raise ValueError(f"Failed to parse Groq response as JSON: {str(e)}")
