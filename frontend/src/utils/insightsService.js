import { fetchTranscription } from './callsService';
import supabase from './supabaseClient';
import axios from 'axios';

// Get the API URL from environment or use a default for development
const API_BASE_URL = process.env.REACT_APP_INSIGHTS_API_URL || 'http://localhost:5001';

/**
 * Processes call insights for a specific call using the insights.py pipeline
 * @param {string} callId - The ID of the call to process
 * @returns {Promise<Object>} - Promise with processed insights
 */
export const processCallInsights = async (callId) => {
  try {
    // 1. First try localStorage for cached insights (fastest)
    try {
      const cachedInsights = localStorage.getItem(`insights_${callId}`);
      if (cachedInsights) {
        console.log('Using cached insights from localStorage for call:', callId);
        return JSON.parse(cachedInsights);
      }
    } catch (cacheError) {
      console.log('No valid cached insights found in localStorage');
    }

    // 2. Check if we already have insights in the database
    const { data: existingCall, error: fetchError } = await supabase
      .from('call_logs')
      .select('insights')
      .eq('call_id', callId)
      .single();
    
    // If we have existing insights, cache them and return
    if (!fetchError && existingCall && existingCall.insights) {
      console.log('Using existing insights from database for call:', callId);
      try {
        // Cache the insights in localStorage for faster future access
        localStorage.setItem(`insights_${callId}`, JSON.stringify(existingCall.insights));
      } catch (storageError) {
        console.warn('Failed to cache insights in localStorage:', storageError);
      }
      return existingCall.insights;
    }
    
    // 3. Check if transcription exists before processing
    const transcription = await fetchTranscription(callId);
    
    if (!transcription || (Array.isArray(transcription) && transcription.length === 0)) {
      throw new Error('No transcription found for this call. Please create a transcription first.');
    }
    
    console.log('Generating insights for call using insights.py pipeline:', callId);
    
    try {
      // 4. Call the backend API to process insights
      const response = await axios.post(`${API_BASE_URL}/api/call-insights/${callId}`);
      
      // 5. Cache the results in localStorage
      try {
        localStorage.setItem(`insights_${callId}`, JSON.stringify(response.data));
      } catch (storageError) {
        console.warn('Failed to cache insights in localStorage:', storageError);
      }
      
      // Return the insights
      return response.data;
    } catch (apiError) {
      console.error('Error calling insights API:', apiError);
      
      if (apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('API response error:', apiError.response.data);
        throw new Error(apiError.response.data.error || 'Failed to process insights via API');
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error('No response received from insights API');
        throw new Error('No response from insights server. Please check if the insights server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw apiError;
      }
    }
  } catch (error) {
    console.error('Error processing insights:', error);
    
    // Only use mock data if specifically requested or if the insights API endpoint is unavailable
    if (localStorage.getItem('use_mock_insights') === 'true' || 
        (error.message && error.message.includes('No response from insights server'))) {
      console.log('Using mock insights as fallback');
      return {
        summary: "This is a mock summary of the call for testing purposes. The sales representative effectively discussed product features, addressed the customer's concerns, and outlined next steps.",
        rating: 85,
        strengths: [
          "Built strong rapport with the customer",
          "Clearly explained product features and benefits",
          "Addressed objections effectively",
          "Used active listening techniques"
        ],
        areas_for_improvement: [
          "Could have asked more open-ended questions",
          "Spent too much time on technical details",
          "Follow-up actions could have been more specific",
          "Missed opportunity to discuss pricing options earlier"
        ],
        buyer_intent: "Interested",
        topics: ["Product Features", "Pricing", "Implementation", "Support", "Timeline"],
        conversational_balance: "The sales rep maintained good balance, allowing the customer to speak about 40% of the time.",
        objection_handling: "Objections were addressed professionally with relevant solutions.",
        pitch_optimization: "The pitch was concise and focused on customer needs.",
        call_to_action: "A clear next step was established with a scheduled follow-up.",
        profanity_level: "Clean ✅",
        raw_insights: {
          // Mock raw data
        }
      };
    }
    
    throw error;
  }
};

/**
 * Fetches insights for a specific call
 * @param {string} callId - The ID of the call to fetch insights for
 * @returns {Promise<Object>} - Promise with insights data
 */
export const fetchCallInsights = async (callId) => {
  try {
    // Check if we have insights for this call
    const { data: call, error } = await supabase
      .from('call_logs')
      .select('insights')
      .eq('call_id', callId)
      .single();
    
    if (!error && call && call.insights) {
      return call.insights;
    }
    
    // If no insights exist, process them
    return await processCallInsights(callId);
  } catch (error) {
    console.error('Error fetching insights:', error);
    throw error;
  }
};