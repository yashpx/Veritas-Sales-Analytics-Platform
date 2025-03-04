import axios from 'axios';

// Create a Groq instance for both transcription and diarization
const groqClient = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Transcribes audio file using Groq's Whisper API endpoint
 * @param {File} audioFile - The audio file to transcribe
 * @returns {Promise} - Promise with transcription result
 */
export const transcribeAudio = async (audioFile) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');
    
    // Reset headers for this specific request
    const headers = {
      'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
      'Content-Type': 'multipart/form-data'
    };
    
    // Call Groq's Whisper API
    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions', 
      formData, 
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

/**
 * Diarizes the transcription to identify different speakers
 * @param {Object} transcription - The transcription from Whisper
 * @returns {Promise} - Promise with diarized transcription
 */
export const diarizeTranscription = async (transcription) => {
  try {
    // Use LLM-Groq to identify speakers
    const response = await groqClient.post('/chat/completions', {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a transcription processing assistant. Analyze the provided transcription and identify different speakers. Return a JSON response with diarized segments.'
        },
        {
          role: 'user',
          content: `Here's a transcription with timestamps. Please identify which parts are likely spoken by different speakers (Speaker 1 and Speaker 2). 

IMPORTANT: The response must be a valid JSON with an array of segments where each segment is an object containing these exact fields: 
- start_time (number)
- end_time (number) 
- text (string)
- speaker (string, "Speaker 1" or "Speaker 2")

Format example:
[
  {
    "start_time": 0.0,
    "end_time": 5.2,
    "text": "Hello, how are you today?",
    "speaker": "Speaker 1"
  },
  {
    "start_time": 5.5,
    "end_time": 10.1,
    "text": "I'm doing well, thank you for asking.",
    "speaker": "Speaker 2"
  }
]

Make your best guess based on content, speaking style, and natural conversation flow. Here's the transcription: ${JSON.stringify(transcription)}`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    // Try to ensure we're returning an array
    try {
      const content = response.data.choices[0].message.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      
      // If we already have an array, return it
      if (Array.isArray(parsed)) {
        return parsed;
      } 
      
      // If we have an array in a property, return that
      if (parsed.segments && Array.isArray(parsed.segments)) {
        return parsed.segments;
      }
      
      // If we have a transcript array, return that
      if (parsed.transcript && Array.isArray(parsed.transcript)) {
        return parsed.transcript;
      }
      
      // Fallback to a default array with the text
      return [{
        start_time: 0,
        end_time: 60,
        text: parsed.text || transcription.text || "Transcript unavailable",
        speaker: "Speaker 1"
      }];
    } catch (err) {
      console.error("Error parsing diarization response:", err);
      // Return a simple fallback
      return [{
        start_time: 0,
        end_time: 60,
        text: typeof transcription === 'string' ? transcription : 
              (transcription.text || "Transcript unavailable"),
        speaker: "Speaker 1"
      }];
    }
  } catch (error) {
    console.error('Diarization error:', error);
    throw error;
  }
};

export default {
  transcribeAudio,
  diarizeTranscription
};