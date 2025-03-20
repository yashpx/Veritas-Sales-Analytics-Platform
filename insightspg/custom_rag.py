import os
import json
import re
import groq
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv(".env.test")

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
        for message in json_transcript["transcript"]:
            conversation += f"{message['speaker']}: {message['text']}\n"
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

        Analyze whether the pitch was concise and relevant. Was it aligned with the prospect’s needs? Suggest improvements for making the pitch clearer and more engaging.

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
        response_text = response.choices[0].message.content.strip()

        return response_text

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
        analysis_sections = parse_analysis_sections(analysis_text)

        analysis["Conversational Balance"] = analysis_sections.get("Conversational Balance", "No data")
        analysis["Objection Handling"] = analysis_sections.get("Objection Handling", "No data")
        analysis["Pitch Optimization"] = analysis_sections.get("Pitch Optimization", "No data")
        analysis["Call-to-Action Execution"] = analysis_sections.get("Call-to-Action Execution", "No data")

        return analysis

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
        "custom_rag_analysis": {
            "output": json.dumps(results)
        }
    }
    
    print(json.dumps(output, indent=4))

if __name__ == "__main__":
    main()