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
    // Use Llama 3.3 70B with Groq to identify speakers - this model has better
    // contextual understanding and can more accurately identify conversation patterns
    const response = await groqClient.post('/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in audio transcription processing and speaker diarization. Your task is to analyze transcripts from business calls and accurately identify different speakers. You have exceptional skill in recognizing speaker switches based on conversation patterns, contextual cues, and speech patterns.'
        },
        {
          role: 'user',
          content: `I need your help with a highly accurate speaker diarization task for a business call transcript. This is a call between a sales representative and a client.

IMPORTANT: The response must be a valid JSON with an array of segments where each segment is an object containing these exact fields: 
- start_time (number): Precise timestamp in seconds when this segment starts
- end_time (number): Precise timestamp in seconds when this segment ends
- text (string): The exact text from the transcript 
- speaker (string): Either "Speaker 1" (sales rep) or "Speaker 2" (client)
- words (array, optional): If the original transcript has word-level timing, include an array of objects with {text, start_time, end_time}

Pay careful attention to:
1. Natural turn-taking patterns in conversation (questions followed by answers)
2. Consistent speaker identification (don't switch who is Speaker 1 or 2 midway)
3. Topic coherence (speakers typically complete their thoughts before switching)
4. Preserving precise timing from the original transcript
5. Breaking segments at natural speaker transitions, not in the middle of thoughts

Format example:
[
  {
    "start_time": 0.0,
    "end_time": 5.2,
    "text": "Hello, how are you today? I'm calling about your recent inquiry.",
    "speaker": "Speaker 1"
  },
  {
    "start_time": 5.5,
    "end_time": 10.1,
    "text": "I'm doing well, thank you for calling. Yes, I was interested in learning more about your services.",
    "speaker": "Speaker 2"
  }
]

Here's the transcription: ${JSON.stringify(transcription)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 32768,
      response_format: { type: 'json_object' }
    });
    
    // Process the response and ensure we're returning a properly formatted array
    try {
      const content = response.data.choices[0].message.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Helper function to validate and format segment
      const processSegment = (segment) => {
        // Ensure all required fields exist with proper types
        const validatedSegment = {
          start_time: typeof segment.start_time === 'number' ? segment.start_time : parseFloat(segment.start_time) || 0,
          end_time: typeof segment.end_time === 'number' ? segment.end_time : parseFloat(segment.end_time) || 0,
          text: segment.text || '',
          speaker: segment.speaker || 'Speaker 1'
        };
        
        // Process word-level timing if available
        if (segment.words && Array.isArray(segment.words)) {
          validatedSegment.words = segment.words.map(word => ({
            text: word.text || '',
            start_time: typeof word.start_time === 'number' ? word.start_time : parseFloat(word.start_time) || 0,
            end_time: typeof word.end_time === 'number' ? word.end_time : parseFloat(word.end_time) || 0
          }));
        }
        
        return validatedSegment;
      };
      
      // If we already have an array, validate and process each segment
      if (Array.isArray(parsed)) {
        return parsed.map(processSegment);
      } 
      
      // If we have an array in a property, process that
      if (parsed.segments && Array.isArray(parsed.segments)) {
        return parsed.segments.map(processSegment);
      }
      
      // If we have a transcript array, process that
      if (parsed.transcript && Array.isArray(parsed.transcript)) {
        return parsed.transcript.map(processSegment);
      }
      
      // Get original whisper transcript information if available
      let originalText = '';
      let originalDuration = 0;
      
      if (transcription.text) {
        originalText = transcription.text;
      }
      
      if (transcription.segments && Array.isArray(transcription.segments) && transcription.segments.length > 0) {
        const lastSegment = transcription.segments[transcription.segments.length - 1];
        originalDuration = lastSegment.end || 60;
      } else if (transcription.duration) {
        originalDuration = transcription.duration;
      }
      
      // Fallback to a default array with the text
      console.warn("Diarization didn't return expected format, using fallback");
      return [{
        start_time: 0,
        end_time: originalDuration || 60,
        text: originalText || parsed.text || "Transcript unavailable",
        speaker: "Speaker 1"
      }];
    } catch (err) {
      console.error("Error parsing diarization response:", err);
      
      // Try to extract useful data from the original Whisper transcription
      try {
        if (transcription.segments && Array.isArray(transcription.segments)) {
          // Convert Whisper segments to our format
          return transcription.segments.map((segment, index) => ({
            start_time: segment.start || 0,
            end_time: segment.end || 0,
            text: segment.text || '',
            speaker: index % 2 === 0 ? "Speaker 1" : "Speaker 2", // Alternate speakers as a naive approach
            words: segment.words
          }));
        }
      } catch (whisperErr) {
        console.error("Error processing original transcription:", whisperErr);
      }
      
      // Last resort fallback
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

/**
 * Corrects speaker assignments in an existing diarized transcription
 * @param {Array} diarizedTranscription - The existing diarized transcription
 * @param {string} segmentId - Index or ID of the segment to correct
 * @param {string} newSpeaker - The corrected speaker label ("Speaker 1" or "Speaker 2")
 * @returns {Array} - Updated diarized transcription
 */
export const correctSpeakerAssignment = (diarizedTranscription, segmentId, newSpeaker) => {
  if (!Array.isArray(diarizedTranscription) || diarizedTranscription.length === 0) {
    console.error('Invalid diarized transcription provided');
    return diarizedTranscription;
  }
  
  const index = parseInt(segmentId, 10);
  if (isNaN(index) || index < 0 || index >= diarizedTranscription.length) {
    console.error(`Invalid segment ID: ${segmentId}`);
    return diarizedTranscription;
  }
  
  // Create a copy of the transcription to avoid mutating the original
  const updatedTranscription = [...diarizedTranscription];
  
  // Update the speaker for the specified segment
  updatedTranscription[index] = {
    ...updatedTranscription[index],
    speaker: newSpeaker
  };
  
  return updatedTranscription;
};

/**
 * Merges two adjacent segments in a diarized transcription
 * @param {Array} diarizedTranscription - The existing diarized transcription
 * @param {number} firstSegmentIndex - Index of the first segment to merge
 * @returns {Array} - Updated diarized transcription with merged segments
 */
export const mergeSegments = (diarizedTranscription, firstSegmentIndex) => {
  if (!Array.isArray(diarizedTranscription) || diarizedTranscription.length <= firstSegmentIndex + 1) {
    console.error('Invalid diarized transcription or segment index');
    return diarizedTranscription;
  }
  
  const secondSegmentIndex = firstSegmentIndex + 1;
  
  // Create a copy of the transcription to avoid mutating the original
  const updatedTranscription = [...diarizedTranscription];
  
  // Get the segments to merge
  const firstSegment = updatedTranscription[firstSegmentIndex];
  const secondSegment = updatedTranscription[secondSegmentIndex];
  
  // Create the merged segment
  const mergedSegment = {
    start_time: firstSegment.start_time,
    end_time: secondSegment.end_time,
    text: `${firstSegment.text} ${secondSegment.text}`.trim(),
    speaker: firstSegment.speaker,
  };
  
  // If both segments have word-level timing, merge those too
  if (firstSegment.words && secondSegment.words) {
    mergedSegment.words = [...firstSegment.words, ...secondSegment.words];
  }
  
  // Replace the first segment with the merged segment and remove the second
  updatedTranscription[firstSegmentIndex] = mergedSegment;
  updatedTranscription.splice(secondSegmentIndex, 1);
  
  return updatedTranscription;
};

/**
 * Splits a segment at a specified word or position
 * @param {Array} diarizedTranscription - The existing diarized transcription
 * @param {number} segmentIndex - Index of the segment to split
 * @param {number} wordIndex - Index of the word to split at, or character position if no words
 * @param {string} secondSpeaker - Speaker for the second part (defaults to same as first)
 * @returns {Array} - Updated diarized transcription with split segment
 */
export const splitSegment = (diarizedTranscription, segmentIndex, wordIndex, secondSpeaker = null) => {
  if (!Array.isArray(diarizedTranscription) || !diarizedTranscription[segmentIndex]) {
    console.error('Invalid diarized transcription or segment index');
    return diarizedTranscription;
  }
  
  // Create a copy of the transcription
  const updatedTranscription = [...diarizedTranscription];
  const segment = updatedTranscription[segmentIndex];
  
  // If we have word-level timing
  if (segment.words && Array.isArray(segment.words) && segment.words.length > wordIndex) {
    const splitWord = segment.words[wordIndex];
    
    // Create first part
    const firstPart = {
      start_time: segment.start_time,
      end_time: splitWord.start_time,
      text: segment.words.slice(0, wordIndex).map(w => w.text).join(' '),
      speaker: segment.speaker,
      words: segment.words.slice(0, wordIndex)
    };
    
    // Create second part
    const secondPart = {
      start_time: splitWord.start_time,
      end_time: segment.end_time,
      text: segment.words.slice(wordIndex).map(w => w.text).join(' '),
      speaker: secondSpeaker || segment.speaker,
      words: segment.words.slice(wordIndex)
    };
    
    // Replace the segment with the two new parts
    updatedTranscription.splice(segmentIndex, 1, firstPart, secondPart);
  } else {
    // No word-level timing, split based on text length and interpolate timing
    const text = segment.text || '';
    
    // Default to splitting in the middle if wordIndex is invalid
    const splitPosition = (wordIndex >= 0 && wordIndex < text.length) ? wordIndex : Math.floor(text.length / 2);
    
    // Calculate approximate time position (linear interpolation)
    const timeRatio = splitPosition / text.length;
    const splitTime = segment.start_time + (segment.end_time - segment.start_time) * timeRatio;
    
    // Create first part
    const firstPart = {
      start_time: segment.start_time,
      end_time: splitTime,
      text: text.substring(0, splitPosition).trim(),
      speaker: segment.speaker
    };
    
    // Create second part
    const secondPart = {
      start_time: splitTime,
      end_time: segment.end_time,
      text: text.substring(splitPosition).trim(),
      speaker: secondSpeaker || segment.speaker
    };
    
    // Replace the segment with the two new parts
    updatedTranscription.splice(segmentIndex, 1, firstPart, secondPart);
  }
  
  return updatedTranscription;
};

export default {
  transcribeAudio,
  diarizeTranscription,
  correctSpeakerAssignment,
  mergeSegments,
  splitSegment
};