import os
import json
import re
import groq
import sys
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Add parent directory to path to import supabase_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_config import get_supabase_client

# Load environment variables
load_dotenv()

class SalesCallAnalyzer:
    def __init__(self, benchmark_folder):
        self.vectorizer = TfidfVectorizer()
        self.benchmark_calls = []
        self.load_benchmarks(benchmark_folder)

    def load_benchmarks(self, folder_path):
        """Load and store benchmark transcripts"""
        for file in os.listdir(folder_path):
            if file.endswith('.txt'):
                with open(os.path.join(folder_path, file), 'r') as f:
                    self.benchmark_calls.append({
                        'transcript': f.read(),
                        'filename': file
                    })
        # Create embeddings for all benchmark transcripts
        transcripts = [call['transcript'] for call in self.benchmark_calls]
        self.benchmark_embeddings = self.vectorizer.fit_transform(transcripts)

    def convert_json_to_text(self, json_transcript):
        """Convert JSON transcript to plain text format"""
        conversation = ""
        
        # Handle different transcript formats
        if isinstance(json_transcript, dict):
            # Format 1: {"conversation": [...]}
            if "conversation" in json_transcript:
                for message in json_transcript["conversation"]:
                    conversation += f"{message['speaker']}: {message['text']}\n"
            # Format 2: {"transcript": [...]}
            elif "transcript" in json_transcript:
                for message in json_transcript["transcript"]:
                    conversation += f"{message['speaker']}: {message['text']}\n"
        # Format 3: Direct list of messages
        elif isinstance(json_transcript, list):
            for message in json_transcript:
                if isinstance(message, dict) and 'speaker' in message and 'text' in message:
                    conversation += f"{message['speaker']}: {message['text']}\n"
        
        # If we still don't have any conversation text, try to extract it from the raw JSON
        if not conversation:
            try:
                # Convert the transcript to a string if it's not already
                transcript_str = json.dumps(json_transcript) if not isinstance(json_transcript, str) else json_transcript
                # Try to find speaker-text patterns
                matches = re.findall(r'"speaker"\s*:\s*"([^"]+)"\s*,\s*"text"\s*:\s*"([^"]+)"', transcript_str)
                for speaker, text in matches:
                    conversation += f"{speaker}: {text}\n"
            except Exception as e:
                print(f"Error extracting conversation from transcript: {e}")
        
        return conversation

    def find_best_matching_benchmark(self, current_transcript_text):
        """Find the most similar benchmark transcript"""
        current_embedding = self.vectorizer.transform([current_transcript_text])
        similarities = cosine_similarity(current_embedding, self.benchmark_embeddings)[0]
        best_match_idx = similarities.argmax()
        best_match_score = similarities[best_match_idx]
        return {
            'benchmark_transcript': self.benchmark_calls[best_match_idx]['transcript'],
            'benchmark_name': self.benchmark_calls[best_match_idx]['filename'],
            'similarity_score': round(best_match_score * 100, 2)
        }

    def analyze_with_groq(self, current_transcript_text, benchmark_match):
        """Use Groq to analyze differences and suggest improvements"""
        client = groq.Client(api_key=os.getenv("GROQ_API_KEY"))

        # Calculate speaking time percentages
        current_lines = current_transcript_text.split('\n')
        sales_rep_lines = [line for line in current_lines if "Speaker 1" in line]
        prospect_lines = [line for line in current_lines if "Speaker 2" in line]
        sales_rep_words = sum(len(line.split()) for line in sales_rep_lines)
        prospect_words = sum(len(line.split()) for line in prospect_lines)
        total_words = sales_rep_words + prospect_words
        sales_rep_percentage = round((sales_rep_words / total_words) * 100) if total_words > 0 else 0

        # Construct prompt for Groq
        prompt = f"""
        You are an expert sales coach analyzing a sales call. Provide structured, case-specific feedback to the sales representative. Ensure your response is clear and actionable.

        Key Metrics:
        - The sales rep spoke {sales_rep_percentage}% of the time.
        - The prospect responded {len(prospect_lines)} times.
        - The call had a {benchmark_match['similarity_score']}% similarity with best practices.

        Analyze and provide four distinct paragraphs, each covering:

        **Conversational Balance**

        Assess whether the sales rep dominated the conversation or encouraged the prospect to speak. Provide specific ways to improve engagement.

        **Objection Handling**

        Evaluate how objections were addressed. Did the rep acknowledge concerns effectively or rush to push a solution? Offer an alternative response to strengthen objection handling.

        **Pitch Optimization**

        Analyze whether the pitch was concise and relevant. Was it aligned with the prospect's needs? Suggest improvements for making the pitch clearer and more engaging.

        **Call-to-Action Execution**

        Review how the call ended. Was the next step clearly defined? Did the prospect commit to an action? Recommend a stronger closing approach to improve conversion.
        """
        
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a senior consultant providing direct, actionable feedback to a sales representative based on actual call performance."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3500,
            temperature=0.7
        )

        # Extract the response text
        analysis_text = response.choices[0].message.content
        
        # Parse the analysis into sections
        return parse_analysis_sections(analysis_text)

def parse_analysis_sections(text):
    """
    Parses the analysis text into sections using a regex pattern.
    Returns a dictionary with the keys:
    - "Conversational Balance"
    - "Objection Handling"
    - "Pitch Optimization"
    - "Call-to-Action Execution"
    If a section is missing, it falls back to "No data".
    """
    # Define the pattern to extract sections
    pattern = r'\*\*(.*?)\*\*\s*(.*?)(?=\*\*|$)'
    matches = re.findall(pattern, text, re.DOTALL)
    
    # Create a dictionary with the sections
    sections = {}
    for title, content in matches:
        title = title.strip()
        content = content.strip()
        sections[title] = content
    
    # Ensure all expected sections are present
    expected_sections = [
        "Conversational Balance",
        "Objection Handling",
        "Pitch Optimization",
        "Call-to-Action Execution"
    ]
    
    for section in expected_sections:
        if section not in sections:
            sections[section] = "No data"
    
    return sections

def get_transcript_from_supabase(call_log_id=None):
    """Fetch the transcript from Supabase for the given call_log_id"""
    try:
        # Get the Supabase client
        supabase = get_supabase_client()
        
        # If call_log_id is provided, fetch that specific call log
        if call_log_id:
            print(f"Fetching call log with ID: {call_log_id}")
            response = supabase.table("call_logs").select("*").eq("call_id", call_log_id).execute()
        else:
            # Otherwise, get the most recent call log
            print("Fetching most recent call log")
            response = supabase.table("call_logs").select("*").order("call_date", desc=True).limit(1).execute()
        
        # Check if we got any data
        if response.data:
            call_log = response.data[0]
            print(f"Found call log with ID: {call_log.get('call_id')}")
            
            # Try different possible column names for transcriptions
            transcript = call_log.get("transcription") or call_log.get("transcript") or call_log.get("transcriptions")
            
            if transcript:
                # If transcript is a string, try to parse it as JSON
                if isinstance(transcript, str):
                    try:
                        print("Parsing transcript from JSON string")
                        parsed_transcript = json.loads(transcript)
                        return parsed_transcript
                    except json.JSONDecodeError as e:
                        print(f"Error parsing JSON: {e}")
                        # If it's not valid JSON, return it as is
                        return transcript
                return transcript
            
            # If no transcript field found, check if there's a JSON string that needs parsing
            for key, value in call_log.items():
                if isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                    try:
                        parsed = json.loads(value)
                        if isinstance(parsed, dict) and ('transcript' in parsed or 'conversation' in parsed):
                            print(f"Found transcript in field: {key}")
                            return parsed
                    except:
                        pass
        
        print("No transcript found in Supabase, falling back to local file")
        return None
    except Exception as e:
        print(f"Error fetching transcript from Supabase: {e}")
        return None

def analyze_sales_call(json_file_path=None, benchmark_folder="benchmark_folder", call_log_id=None):
    """Main function to analyze a sales call and return individual feedback sections."""
    try:
        # Initialize the analyzer
        analyzer = SalesCallAnalyzer(benchmark_folder)
        
        # Get the transcript - either from file or from Supabase
        transcript_data = None
        if call_log_id or os.getenv("CALL_LOG_ID"):
            # Use the provided call_log_id or get it from environment
            call_log_id = call_log_id or os.getenv("CALL_LOG_ID")
            print(f"Analyzing call log ID from environment: {call_log_id}")
            transcript_data = get_transcript_from_supabase(call_log_id)
        elif json_file_path:
            # Load from file if specified
            print(f"Loading transcript from file: {json_file_path}")
            with open(json_file_path, 'r') as file:
                transcript_data = json.load(file)
        else:
            # Default to most recent call log
            print("No call log ID or file path provided, fetching most recent call log")
            transcript_data = get_transcript_from_supabase()
        
        # If no transcript data found, try to use the default transcript file
        if not transcript_data:
            default_transcript_path = os.getenv("TRANSCRIPT_FILE_PATH", "../transcription_25.json")
            try:
                print(f"No transcript data found, using default transcript from {default_transcript_path}")
                with open(default_transcript_path, 'r') as file:
                    transcript_data = json.load(file)
                print(f"Loaded default transcript successfully")
            except Exception as e:
                print(f"Error loading default transcript: {e}")
                return {"error": "No transcript data found"}
        
        # Print the type and structure of the transcript data for debugging
        print(f"Transcript data type: {type(transcript_data)}")
        if isinstance(transcript_data, dict):
            print(f"Transcript data keys: {transcript_data.keys()}")
        elif isinstance(transcript_data, list):
            print(f"Transcript data is a list with {len(transcript_data)} items")
            if transcript_data and isinstance(transcript_data[0], dict):
                print(f"First item keys: {transcript_data[0].keys()}")
        
        # Convert JSON transcript to text
        transcript_text = analyzer.convert_json_to_text(transcript_data)
        print(f"Converted transcript to text (first 100 chars): {transcript_text[:100]}...")
        
        # Find the best matching benchmark
        best_match = analyzer.find_best_matching_benchmark(transcript_text)
        print(f"Best matching benchmark: {best_match['benchmark_name']} with score {best_match['similarity_score']}%")
        
        # Analyze with Groq
        analysis = analyzer.analyze_with_groq(transcript_text, best_match)
        print("Analysis completed successfully")
        
        # Return the analysis
        return analysis
    
    except Exception as e:
        print(f"Error analyzing sales call: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

def main():
    """Main function to run the analysis and output results"""
    # Check if a call_log_id was provided via environment variable
    call_log_id = os.getenv("CALL_LOG_ID")
    
    # Check for transcript file from environment variable
    transcript_file = os.getenv("TRANSCRIPT_FILE")
    
    # Default file path if needed
    json_file_path = transcript_file if transcript_file else "diarized-transcript.json"
    
    # Verify the file exists if using a file path
    if not call_log_id and not os.path.exists(json_file_path):
        print(f"Error: Transcript file does not exist: {json_file_path}", file=sys.stderr)
        sys.exit(1)
    
    # Run the analysis
    if call_log_id:
        print(f"Analyzing call log ID: {call_log_id}")
        result = analyze_sales_call(call_log_id=call_log_id)
    else:
        print(f"Analyzing file: {json_file_path}")
        result = analyze_sales_call(json_file_path=json_file_path)
    
    # Format output for insights.py
    output = {
        "custom_rag_analysis": {
            "output": json.dumps(result)
        }
    }
    
    # Print the result as JSON
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()