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
          content: 'You are an expert in audio transcription processing, linguistics, and speaker diarization. Your specialty is analyzing business call audio transcripts, identifying different speakers with high accuracy, and breaking conversations into proper sentence-level segments based on natural speech patterns. You have exceptional skill in recognizing speaker switches based on conversation context, linguistic cues, and speech patterns.'
        },
        {
          role: 'user',
          content: `I need your help with a highly accurate speaker diarization task for a business sales call transcript. This is a call between a sales representative (Agent) and a customer (Caller).

IMPORTANT FORMATTING REQUIREMENTS:
1. The response must be a valid JSON array of segments
2. Each segment should represent a SINGLE COMPLETE SENTENCE or natural speech unit
3. Break the transcript at EVERY sentence boundary (periods, question marks, exclamation points)
4. Each segment must contain these exact fields: 
   - start_time (number): Precise timestamp in seconds when this segment starts
   - end_time (number): Precise timestamp in seconds when this segment ends
   - text (string): The exact text for this single sentence or speech unit
   - speaker (string): Either "Agent" (sales rep) or "Caller" (customer)
   - words (array, optional): If the original transcript has word-level timing, include an array of objects with {text, start_time, end_time}

SPEAKER IDENTIFICATION GUIDELINES:
1. Analyze the ENTIRE conversation first to identify speaker patterns
2. The first speaker is typically the "Agent" (sales representative) who opens the call
3. Look for these reliable indicators:
   - Agent: Uses professional greetings, company identification, offers assistance
   - Agent: Uses phrases like "How may I help you?", "Thank you for calling"
   - Agent: References systems, procedures, product information 
   - Caller: Explains their problem/need, asks questions about services
   - Caller: Provides personal details or situation information
   - Caller: Uses phrases like "I wanted to know", "I'm calling about my order"
4. Maintain speaker consistency - the same person should be labeled the same throughout
5. For any segments where the speaker is truly ambiguous, use context from surrounding segments

SEGMENTATION REQUIREMENTS:
1. Split the transcript at EVERY sentence boundary (periods, question marks, exclamation points)
2. Create a new segment whenever the speaker changes
3. For very long statements by the same speaker, break into logical segments of 1-2 sentences each
4. Preserve the original timestamps (or distribute them proportionally if splitting a segment)
5. Preserve all original words, phrases and meaning

Format example:
[
  {
    "start_time": 0.0,
    "end_time": 2.4,
    "text": "Hello, this is John from ABC Company.",
    "speaker": "Agent"
  },
  {
    "start_time": 2.4,
    "end_time": 5.2,
    "text": "How can I help you today?",
    "speaker": "Agent"
  },
  {
    "start_time": 5.5,
    "end_time": 8.3,
    "text": "Hi, I'm calling about my recent order.",
    "speaker": "Caller"
  },
  {
    "start_time": 8.3,
    "end_time": 10.1,
    "text": "I haven't received it yet and it's been two weeks.",
    "speaker": "Caller"
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

/**
 * Cleans and formats a transcript using Groq LLM
 * @param {Object|string} transcription - Transcription in potentially messy format
 * @returns {Promise<Array>} - Promise with cleaned and formatted transcription
 */
export const cleanTranscriptWithGroq = async (transcription) => {
  try {
    // Parse if string
    let transcriptObj = transcription;
    if (typeof transcription === 'string') {
      try {
        transcriptObj = JSON.parse(transcription);
      } catch (e) {
        // If can't parse, use as is
        transcriptObj = { text: transcription };
      }
    }

    // Send to Groq for cleaning and formatting
    const response = await groqClient.post('/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in conversation analysis, linguistics, and transcript formatting. Your specialty is analyzing business call transcripts, identifying different speakers with high accuracy, and breaking conversations into proper segments based on natural speech patterns.'
        },
        {
          role: 'user',
          content: `I need your help cleaning and formatting this sales call transcription data. The transcription may be in various formats, but I need it converted to a standard format with highly accurate speaker identification and proper sentence-level segmentation.

IMPORTANT FORMATTING REQUIREMENTS:
1. The response must be a valid JSON array of segments
2. Each segment should represent a SINGLE COMPLETE SENTENCE or natural speech unit
3. Break at every period/full stop to create new segments
4. Each segment must have these properties:
   - speaker: Should be either "Agent" (sales rep) or "Caller" (customer) based on context clues
   - text: The exact text for this single sentence or speech unit
   - start_time: A numeric value for when this segment starts (use sequential integers if not provided)
   - end_time: A numeric value for when this segment ends (use start_time + 1 if not provided)

Here's the transcription to clean and format: ${JSON.stringify(transcriptObj)}

SPEAKER IDENTIFICATION GUIDELINES:
1. Analyze the ENTIRE conversation first to identify speaker patterns
2. The first speaker is typically the "Agent" (sales representative) who opens the call
3. Look for these reliable indicators:
   - Agent: Uses professional greetings, company identification, offers assistance
   - Agent: Uses phrases like "How may I help you?", "Thank you for calling"
   - Agent: References systems, procedures, product information 
   - Caller: Explains their problem/need, asks questions about services
   - Caller: Provides personal details or situation information
   - Caller: Uses phrases like "I wanted to know", "I'm calling about my order"
4. Maintain speaker consistency - the same person should be labeled the same throughout
5. For any segments where the speaker is truly ambiguous, use context from previous and following segments

SEGMENTATION REQUIREMENTS:
1. Split the transcript at EVERY sentence boundary (periods, question marks, exclamation points)
2. Create a new segment whenever the speaker changes
3. For very long statements by the same speaker, break into logical segments of 1-2 sentences each
4. Preserve all original words, phrases and meaning

Return ONLY the correctly formatted JSON array with no additional explanation.`
        }
      ],
      temperature: 0.1,
      max_tokens: 32768,
      response_format: { type: 'json_object' }
    });

    // Process the response
    try {
      const content = response.data.choices[0].message.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      
      // If we get an array directly
      if (Array.isArray(parsed)) {
        return parsed.map((segment, index) => ({
          speaker: segment.speaker || `Speaker ${index % 2 + 1}`,
          text: segment.text || "",
          start_time: segment.start_time || index,
          end_time: segment.end_time || (index + 1)
        }));
      }
      
      // If we get an array within an object
      if (parsed.segments && Array.isArray(parsed.segments)) {
        return parsed.segments;
      }
      
      // If we get a conversation array
      if (parsed.conversation && Array.isArray(parsed.conversation)) {
        return parsed.conversation.map((segment, index) => ({
          speaker: segment.speaker || `Speaker ${index % 2 + 1}`,
          text: segment.text || "",
          start_time: segment.start_time || index,
          end_time: segment.end_time || (index + 1)
        }));
      }
      
      // Fallback
      return [{
        speaker: "Speaker 1",
        text: typeof transcription === 'string' ? transcription : JSON.stringify(transcription),
        start_time: 0,
        end_time: 1
      }];
    } catch (err) {
      console.error("Error parsing clean transcript response:", err);
      return [{
        speaker: "Speaker 1",
        text: typeof transcription === 'string' ? transcription : JSON.stringify(transcription),
        start_time: 0,
        end_time: 1
      }];
    }
  } catch (error) {
    console.error('Clean transcript error:', error);
    // Return original in case of error
    if (typeof transcription === 'string') {
      return [{
        speaker: "Speaker 1",
        text: transcription,
        start_time: 0,
        end_time: 1
      }];
    }
    return Array.isArray(transcription) ? transcription : [transcription];
  }
};

/**
 * Generate insights from transcription
 * @param {Array} transcription - The diarized transcription array
 * @returns {Promise} - Promise with insights analysis
 */
export const generateInsights = async (transcription) => {
  try {
    // Use Llama 3.3 70B with Groq to analyze the transcription
    const response = await groqClient.post('/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI assistant specialized in sales call analysis and coaching. Your role is to provide comprehensive insights from sales call transcripts, helping sales representatives improve their performance. You analyze call transcripts to identify strengths, areas for improvement, and actionable recommendations.'
        },
        {
          role: 'user',
          content: `Please analyze this sales call transcription and provide detailed insights. I need:

1. A comprehensive summary of the call (3-4 sentences)
2. An overall call rating (as a percentage)
3. 3-5 specific strengths demonstrated in the call
4. 3-5 areas for improvement with actionable advice
5. A sentiment analysis of the buyer's intent (Very Interested, Interested, Neutral, Not Interested, Objecting)
6. Key topics discussed during the call

Format your response as valid JSON with the following structure:
{
  "summary": "Comprehensive summary of the call...",
  "rating": 85,
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areas_for_improvement": ["Area 1", "Area 2", "Area 3"],
  "buyer_intent": "Interested",
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}

Here's the call transcript: ${JSON.stringify(transcription)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 32768,
      response_format: { type: 'json_object' }
    });
    
    // Return the generated insights
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Insights generation error:', error);
    throw error;
  }
};

export default {
  transcribeAudio,
  diarizeTranscription,
  correctSpeakerAssignment,
  mergeSegments,
  splitSegment,
  cleanTranscriptWithGroq,
  generateInsights
};