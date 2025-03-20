#!/usr/bin/env python3
"""
detect_profanity.py

Reads 'diarized-transcript.json' and checks for profanity using a simple word list approach.
Flags any responses containing profanity with 'X' and categorizes severity.

Severity Levels:
1. Clean → No profanity detected.
2. Mild → Minor language (e.g., "hell", "damn").
3. Moderate → Medium severity (e.g., "bastard", "bitch").
4. Severe → Explicit profanity (e.g., "f***", "n*****", "c***").
"""

import json
import re

# Custom severity levels for different types of words
SEVERITY_LEVELS = {
    'mild': ["damn", "hell", "crap", "stupid", "dumb", "idiot", "piss", "suck"],
    'moderate': ["ass", "bastard", "bitch", "dick", "prick", "whore", "slut"],
    'severe': ["f***", "s***", "c***", "n*****", "motherf***er"]
}

def load_transcript(file_path: str) -> dict:
    """
    Loads the JSON file containing the diarized transcript.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def detect_profanity(text: str) -> (str, list):
    """
    Detects the severity level of profanity in a given text.
    Returns a tuple of severity and a list of detected words.
    """
    words = re.findall(r'\b\w+\b', text.lower())
    detected_words = []

    for level, word_list in SEVERITY_LEVELS.items():
        if any(word in words for word in word_list):
            detected_words.extend([word for word in words if word in word_list])
            return level, detected_words  # Return the first matched level

    return "clean", []

def analyze_transcript(transcript_data: dict) -> dict:
    """
    Analyzes the transcript for profanity and returns flagged lines.
    """
    flagged_transcript = []
    detected_profanities = []
    severity_counts = {"mild": 0, "moderate": 0, "severe": 0}

    for entry in transcript_data.get("transcript", []):
        speaker = entry.get("speaker", "Unknown Speaker")
        text = entry.get("text", "")

        severity, detected_words = detect_profanity(text)

        if severity != "clean":
            severity_counts[severity] += 1
            detected_profanities.extend(detected_words)
            flagged_transcript.append(f"{speaker}: {text} ❌")
        else:
            flagged_transcript.append(f"{speaker}: {text}")

    # Determine the overall severity level
    if severity_counts["severe"] > 0:
        overall_severity = "Severe ❌"
    elif severity_counts["moderate"] > 0:
        overall_severity = "Moderate ❗"
    elif severity_counts["mild"] > 0:
        overall_severity = "Mild ⚠️"
    else:
        overall_severity = "Clean ✅"

    return {
        "severity level": overall_severity,
        "flagged_transcript": flagged_transcript,
        "detected_profanities": list(set(detected_profanities))  # Unique words only
    }

def main():
    """Runs the profanity detection pipeline and prints JSON output."""
    json_file_path = "diarized-transcript.json"

    # Load transcript
    transcript_data = load_transcript(json_file_path)

    # Run profanity detection
    results = analyze_transcript(transcript_data)

    # Build the JSON output in the desired format
    output = {
        "severity level": results["severity level"]
    }
    if results["detected_profanities"]:
        output["report"] = "Profanity detected."
        output["flagged_transcript"] = results["flagged_transcript"]
        output["detected_profanities"] = results["detected_profanities"]
    else:
        output["report"] = "No profanity detected."

    # Wrap the output in the JSON structure expected by React:
    # {
    #     "profanity_check": {
    #         "output": "<stringified JSON of output>"
    #     }
    # }
    final_output = {
        "profanity_check": {
            "output": json.dumps(output, ensure_ascii=False)
        }
    }
    print(json.dumps(final_output, indent=4, ensure_ascii=False))

if __name__ == "__main__":
    main()