import os
import json
import re
import sys
from dotenv import load_dotenv
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    sklearn_available = True
except ImportError:
    sklearn_available = False
    print("Warning: sklearn not available, using fallback analysis", file=sys.stderr)

# Load environment variables
load_dotenv()

class SalesCallAnalyzer:
    def __init__(self, benchmark_folder):
        if not sklearn_available:
            self.vectorizer = None
            self.benchmark_calls = []
            print("Warning: sklearn not available, analysis will be limited", file=sys.stderr)
            return
            
        self.vectorizer = TfidfVectorizer()
        self.benchmark_calls = []
        self.load_benchmarks(benchmark_folder)

    def load_benchmarks(self, folder_path):
        """Load and store benchmark transcripts"""
        if not sklearn_available:
            return
            
        if not os.path.exists(folder_path):
            print(f"Warning: Benchmark folder {folder_path} does not exist", file=sys.stderr)
            return
            
        for file in os.listdir(folder_path):
            if file.endswith('.txt'):
                try:
                    with open(os.path.join(folder_path, file), 'r') as f:
                        self.benchmark_calls.append({
                            'transcript': f.read(),
                            'filename': file
                        })
                except Exception as e:
                    print(f"Error loading benchmark file {file}: {str(e)}", file=sys.stderr)
                    
        # Create embeddings for all benchmark transcripts if we have any
        if self.benchmark_calls:
            transcripts = [call['transcript'] for call in self.benchmark_calls]
            self.benchmark_embeddings = self.vectorizer.fit_transform(transcripts)
        else:
            print("Warning: No benchmark transcripts found", file=sys.stderr)

    def convert_json_to_text(self, json_transcript):
        """Convert JSON transcript to plain text format"""
        conversation = ""
        try:
            for segment in json_transcript.get('segments', []):
                speaker = segment.get('speaker', 'Unknown')
                text = segment.get('text', '')
                conversation += f"{speaker}: {text}\n"
        except Exception as e:
            print(f"Error converting JSON to text: {str(e)}", file=sys.stderr)
        return conversation

    def find_best_matching_benchmark(self, current_transcript_text):
        """Find the most similar benchmark transcript"""
        if not sklearn_available or not self.benchmark_calls:
            return {
                'benchmark_transcript': "No benchmark available",
                'benchmark_name': "No benchmark available",
                'similarity_score': 0
            }
            
        try:
            current_embedding = self.vectorizer.transform([current_transcript_text])
            similarities = cosine_similarity(current_embedding, self.benchmark_embeddings)[0]
            best_match_idx = similarities.argmax()
            best_match_score = similarities[best_match_idx]
            return {
                'benchmark_transcript': self.benchmark_calls[best_match_idx]['transcript'],
                'benchmark_name': self.benchmark_calls[best_match_idx]['filename'],
                'similarity_score': round(best_match_score * 100, 2)
            }
        except Exception as e:
            print(f"Error finding best matching benchmark: {str(e)}", file=sys.stderr)
            return {
                'benchmark_transcript': "Error in benchmark matching",
                'benchmark_name': "Error",
                'similarity_score': 0
            }

    def analyze_with_groq(self, current_transcript_text, benchmark_match):
        """Use Groq to analyze differences and suggest improvements"""
        try:
            # Try to import groq module
            import groq
            # Initialize Groq client
            client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))
            
            # Create the prompt for analysis
            prompt = f"""
            You are an expert sales coach analyzing sales call transcripts. Compare the current sales call with a benchmark high-performing call and provide specific, actionable feedback.
            
            CURRENT CALL TRANSCRIPT:
            {current_transcript_text[:2000]}  # Limit length to avoid token limits
            
            BENCHMARK CALL (Similarity Score: {benchmark_match['similarity_score']}%):
            {benchmark_match['benchmark_transcript'][:2000]}  # Limit length to avoid token limits
            
            Analyze the differences between these calls and provide feedback in these specific areas:
            
            1. Conversational Balance: Analyze the balance of speaking time between the sales rep and prospect. Is the rep talking too much or too little?
            
            2. Objection Handling: How well does the rep address customer concerns or objections? What could be improved?
            
            3. Pitch Optimization: Evaluate how well the rep presents the product/service and its value proposition.
            
            4. Call-to-Action Execution: Assess how effectively the rep guides the prospect toward the next steps or a decision.
            
            Format your response with these exact section headers, followed by 2-3 sentences of specific feedback for each.
            """
            
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
                model="llama3-70b-8192",
                temperature=0.5,
                max_tokens=1024,
                stream=False
            )
            
            # Extract the response
            analysis_text = chat_completion.choices[0].message.content
            return analysis_text
            
        except ImportError:
            # If groq module is not available, return a fallback response
            print("Error: groq module not installed", file=sys.stderr)
            return """
            Conversational Balance: Not available - Groq API module missing
            
            Objection Handling: Not available - Groq API module missing
            
            Pitch Optimization: Not available - Groq API module missing
            
            Call-to-Action Execution: Not available - Groq API module missing
            """
        except Exception as e:
            # Handle any other exceptions
            print(f"Error in analyze_with_groq: {str(e)}", file=sys.stderr)
            return f"""
            Conversational Balance: Error in analysis: {str(e)}
            
            Objection Handling: Error in analysis: {str(e)}
            
            Pitch Optimization: Error in analysis: {str(e)}
            
            Call-to-Action Execution: Error in analysis: {str(e)}
            """

    def analyze_transcript(self, current_transcript_text, benchmark_match):
        """Analyze the transcript and provide feedback"""
        analysis = {
            "Conversational Balance": "",
            "Objection Handling": "",
            "Pitch Optimization": "",
            "Call-to-Action Execution": "",
        }

        # Generate the analysis using the template
        analysis_text = self.analyze_with_groq(current_transcript_text, benchmark_match)
        analysis_sections = self.parse_analysis_sections(analysis_text)

        analysis["Conversational Balance"] = analysis_sections.get("Conversational Balance", "No data")
        analysis["Objection Handling"] = analysis_sections.get("Objection Handling", "No data")
        analysis["Pitch Optimization"] = analysis_sections.get("Pitch Optimization", "No data")
        analysis["Call-to-Action Execution"] = analysis_sections.get("Call-to-Action Execution", "No data")

        return analysis

    def parse_analysis_sections(self, text):
        """
        Parses the analysis text into sections using a regex pattern.
        Returns a dictionary with the keys:
        - "Conversational Balance"
        - "Objection Handling"
        - "Pitch Optimization"
        - "Call-to-Action Execution"
        If a section is missing, it falls back to "No data".
        """
        text = text.strip()
        pattern = r"\*\*(Conversational Balance|Objection Handling|Pitch Optimization|Call-to-Action Execution)\*\*\s*(.*?)(?=\n\*\*|$)"
        matches = re.findall(pattern, text, re.DOTALL)
        sections = {k.strip(): v.strip() for k, v in matches}

        # Ensure all sections exist
        required_sections = ["Conversational Balance", "Objection Handling", "Pitch Optimization", "Call-to-Action Execution"]
        for section in required_sections:
            if section not in sections:
                sections[section] = "No data"

        return sections

def analyze_sales_call(json_file_path, benchmark_folder="benchmark_folder"):
    """Main function to analyze a sales call and return individual feedback sections."""
    analyzer = SalesCallAnalyzer(benchmark_folder)

    # Check if the transcript file exists
    if not os.path.exists(json_file_path):
        print(f"Error: Transcript file '{json_file_path}' not found.")
        return {
            "Conversational Balance": "No data",
            "Objection Handling": "No data",
            "Pitch Optimization": "No data",
            "Call-to-Action Execution": "No data",
        }

    with open(json_file_path, 'r') as f:
        transcript_data = json.load(f)

    transcript_text = analyzer.convert_json_to_text(transcript_data)
    benchmark_match = analyzer.find_best_matching_benchmark(transcript_text)
    analysis = analyzer.analyze_transcript(transcript_text, benchmark_match)

    return analysis

def main():
    """Main function to run the analysis and output results"""
    json_file_path = "diarized-transcript.json"
    results = analyze_sales_call(json_file_path)
    
    # Format output for insights.py
    output = {
        "custom_rag": {
            "output": json.dumps(results)
        }
    }
    
    print(json.dumps(output, indent=4))

if __name__ == "__main__":
    main()