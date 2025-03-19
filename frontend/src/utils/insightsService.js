import { generateInsights } from './groqApiClient';
import { fetchTranscription } from './callsService';
import supabase from './supabaseClient';

/**
 * Processes call insights for a specific call
 * @param {string} callId - The ID of the call to process
 * @returns {Promise<Object>} - Promise with processed insights
 */
export const processCallInsights = async (callId) => {
  try {
    // Check if we already have insights for this call
    const { data: existingCall, error: fetchError } = await supabase
      .from('call_logs')
      .select('insights')
      .eq('id', callId)
      .single();
    
    // If we have existing insights, return them
    if (!fetchError && existingCall && existingCall.insights) {
      console.log('Using existing insights for call:', callId);
      return existingCall.insights;
    }
    
    // Fetch the transcription for the call
    const transcription = await fetchTranscription(callId);
    
    if (!transcription || (Array.isArray(transcription) && transcription.length === 0)) {
      throw new Error('No transcription found for this call. Please create a transcription first.');
    }
    
    // Generate insights using the Groq API
    console.log('Generating insights for call:', callId);
    const rawInsightsJson = await generateInsights(transcription);
    
    // Parse the JSON result
    const rawInsights = typeof rawInsightsJson === 'string' ? JSON.parse(rawInsightsJson) : rawInsightsJson;
    
    // Format the insights for storage and display
    const formattedInsights = {
      summary: rawInsights.summary || 'No summary available',
      rating: rawInsights.rating || 0,
      strengths: rawInsights.strengths || [],
      areas_for_improvement: rawInsights.areas_for_improvement || [],
      buyer_intent: rawInsights.buyer_intent || 'Neutral',
      topics: rawInsights.topics || [],
      raw_insights: rawInsights // Store the full raw data
    };
    
    // Save the insights to the database
    const { error: updateError } = await supabase
      .from('call_logs')
      .update({
        insights: formattedInsights,
        processed_at: new Date().toISOString()
      })
      .eq('id', callId);
    
    if (updateError) {
      console.error('Error saving insights to database:', updateError);
    } else {
      console.log('Insights saved to database for call:', callId);
    }
    
    return formattedInsights;
  } catch (error) {
    console.error('Error processing insights:', error);
    
    // In development mode, return mock insights
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock insights for development');
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
      .eq('id', callId)
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