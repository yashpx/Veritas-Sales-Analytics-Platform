import supabase from './supabaseClient';

/**
 * Process insights for a specific call log
 * @param {number} callId - The ID of the call to process insights for
 * @returns {Promise} - Promise with processed insights
 */
export const processCallInsights = async (callId) => {
  console.log(`processCallInsights called with callId: ${callId}`);
  
  try {
    console.log(`Processing insights for call ID: ${callId}`);
    
    // First check if insights already exist in call_logs table
    // Try with both call_id and id fields
    let existingCall, existingError;
    
    // First try with call_id
    console.log(`Querying call_logs with call_id = ${callId}`);
    const callIdResult = await supabase
      .from('call_logs')
      .select('insights, id, call_id')
      .eq('call_id', callId)
      .single();
      
    existingCall = callIdResult.data;
    existingError = callIdResult.error;
    
    // If that fails, try with id
    if (existingError) {
      console.log(`No results found with call_id=${callId}, trying with id field instead`);
      const idResult = await supabase
        .from('call_logs')
        .select('insights, id, call_id')
        .eq('id', callId)
        .single();
        
      existingCall = idResult.data;
      existingError = idResult.error;
    }
    
    console.log('Existing call query result:', { 
      success: !existingError, 
      error: existingError ? existingError.message : null,
      hasInsights: existingCall && existingCall.insights ? true : false,
      callId: existingCall ? existingCall.call_id : null,
      id: existingCall ? existingCall.id : null
    });
    
    if (!existingError && existingCall && existingCall.insights) {
      console.log(`Using existing insights for call ${callId}`);
      return existingCall.insights;
    }
    
    // Determine the actual database ID to use
    const dbCallId = existingCall ? (existingCall.call_id || existingCall.id) : callId;
    console.log(`Using database call ID: ${dbCallId} for processing insights`);
    
    console.log(`No existing insights found for call ${dbCallId}, processing new insights...`);
    
    // Call the insights pipeline API to process the call
    console.log(`Calling insights pipeline API for call ${dbCallId}`);
    
    try {
      const response = await fetch(`http://localhost:5001/api/process-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callLogId: dbCallId }),
      });
      
      console.log(`API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error response: ${errorText}`);
        throw new Error(`Failed to process insights: ${response.statusText} - ${errorText.substring(0, 100)}`);
      }
      
      // Get the processed insights from the response
      const insightsData = await response.json();
      console.log('API response data:', insightsData);
      
      // Format the insights data for frontend display
      const insights = {
        summary: extractSummary(insightsData),
        key_points: extractKeyPoints(insightsData),
        action_items: extractActionItems(insightsData),
        sentiment: extractSentiment(insightsData),
        topics: extractTopics(insightsData),
        raw_insights: insightsData // Keep the raw data for reference
      };
      
      // Update the call log with insights - try both fields
      let updateResult;
      
      // First try with call_id if we have it
      if (existingCall && existingCall.call_id) {
        updateResult = await supabase
          .from('call_logs')
          .update({
            insights: insights,
            processed_at: new Date().toISOString()
          })
          .eq('call_id', existingCall.call_id)
          .select('insights')
          .single();
      } else {
        // Otherwise try with id
        updateResult = await supabase
          .from('call_logs')
          .update({
            insights: insights,
            processed_at: new Date().toISOString()
          })
          .eq('id', existingCall ? existingCall.id : callId)
          .select('insights')
          .single();
      }
      
      const { data: updatedCall, error: updateError } = updateResult;
      
      console.log('Update call log result:', { 
        success: !updateError, 
        error: updateError ? updateError.message : null,
        data: updatedCall
      });
      
      if (updateError) {
        console.error('Error updating call log with insights:', updateError);
        // Even if the update fails, return the insights we got
        return insights;
      }
      
      return updatedCall.insights;
    } catch (apiError) {
      console.error('API Error:', apiError);
      
      // For testing/development, return mock data if the API call fails
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log('Using mock insights data for testing due to API error');
        
        // Create mock insights data
        const mockInsights = {
          summary: "This is a mock summary of the call for testing purposes. The conversation covered product features, pricing, and next steps.",
          key_points: [
            "Discussed product features and benefits",
            "Covered pricing options",
            "Scheduled a follow-up demo"
          ],
          action_items: [
            "Send follow-up email with pricing details",
            "Schedule demo for next week",
            "Share case studies"
          ],
          sentiment: "Positive",
          topics: ["Product Features", "Pricing", "Demo", "Follow-up"],
          raw_insights: {
            call_summary: { output: JSON.stringify({ summary: "Mock summary" }) },
            custom_rag_analysis: { output: JSON.stringify({ "Topic 1": "Details" }) }
          }
        };
        
        return mockInsights;
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error(`Error processing insights for call ID ${callId}:`, error);
    throw error;
  }
};

/**
 * Fetch insights for a specific call log
 * @param {number} callId - The ID of the call to fetch insights for
 * @returns {Promise} - Promise with insights data
 */
export const fetchCallInsights = async (callId) => {
  console.log(`fetchCallInsights called with callId: ${callId}`);
  
  try {
    console.log(`Fetching insights for call ID: ${callId}`);
    
    // Check if insights exist in the call_logs table
    // Try with both call_id and id fields
    let call, error;
    
    // First try with call_id
    console.log(`Querying call_logs with call_id = ${callId}`);
    const callIdResult = await supabase
      .from('call_logs')
      .select('insights, transcription, id, call_id')
      .eq('call_id', callId)
      .single();
      
    call = callIdResult.data;
    error = callIdResult.error;
    
    // If that fails, try with id
    if (error) {
      console.log(`No results found with call_id=${callId}, trying with id field instead`);
      const idResult = await supabase
        .from('call_logs')
        .select('insights, transcription, id, call_id')
        .eq('id', callId)
        .single();
        
      call = idResult.data;
      error = idResult.error;
    }
    
    console.log('Fetch call insights result:', { 
      success: !error, 
      error: error ? error.message : null,
      hasInsights: call && call.insights ? true : false,
      hasTranscription: call && call.transcription ? true : false,
      callId: call ? call.call_id : null,
      id: call ? call.id : null
    });
    
    if (!error && call && call.insights) {
      console.log(`Found insights for call ${callId}`);
      return call.insights;
    }
    
    // For mock data in the Calls.js, we might not have a real call in the database
    // In this case, we'll create a mock call log entry first
    if (error && error.message.includes("No rows found")) {
      console.log(`No call log found for ID ${callId}, this might be a mock call from the UI`);
      
      // For testing/development, return mock data if this is a mock call
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log('Using mock insights data for testing');
        
        // Create mock insights data
        const mockInsights = {
          summary: "This is a mock summary of the call for testing purposes. The conversation covered product features, pricing, and next steps.",
          key_points: [
            "Discussed product features and benefits",
            "Covered pricing options",
            "Scheduled a follow-up demo"
          ],
          action_items: [
            "Send follow-up email with pricing details",
            "Schedule demo for next week",
            "Share case studies"
          ],
          sentiment: "Positive",
          topics: ["Product Features", "Pricing", "Demo", "Follow-up"],
          raw_insights: {
            call_summary: { output: JSON.stringify({ summary: "Mock summary" }) },
            custom_rag_analysis: { output: JSON.stringify({ "Topic 1": "Details" }) }
          }
        };
        
        return mockInsights;
      }
    }
    
    // Check if there's a transcription before processing
    if (!call || !call.transcription) {
      console.error(`No transcription found for call ${callId}, cannot process insights`);
      throw new Error(`No transcription found for call ${callId}. Please create a transcription first.`);
    }
    
    // If no insights exist, process them
    console.log(`No insights found for call ${callId}, processing now...`);
    return await processCallInsights(callId);
  } catch (error) {
    console.error(`Error fetching insights for call ID ${callId}:`, error);
    throw error;
  }
};

/**
 * Helper functions to extract specific insights from the raw insights data
 */

// Extract summary from insights data
const extractSummary = (insightsData) => {
  try {
    if (insightsData.call_summary && insightsData.call_summary.output) {
      const callSummary = JSON.parse(insightsData.call_summary.output);
      return callSummary.summary || "No summary available";
    }
  } catch (error) {
    console.error("Error extracting summary:", error);
  }
  return "No summary available";
};

// Extract key points from insights data
const extractKeyPoints = (insightsData) => {
  try {
    if (insightsData.call_summary && insightsData.call_summary.output) {
      const callSummary = JSON.parse(insightsData.call_summary.output);
      return callSummary.strengths || [];
    }
  } catch (error) {
    console.error("Error extracting key points:", error);
  }
  return [];
};

// Extract action items from insights data
const extractActionItems = (insightsData) => {
  try {
    if (insightsData.call_summary && insightsData.call_summary.output) {
      const callSummary = JSON.parse(insightsData.call_summary.output);
      return callSummary.areas_for_improvement || [];
    }
  } catch (error) {
    console.error("Error extracting action items:", error);
  }
  return [];
};

// Extract sentiment from insights data
const extractSentiment = (insightsData) => {
  try {
    if (insightsData.buyer_intent && insightsData.buyer_intent.output) {
      const buyerIntent = JSON.parse(insightsData.buyer_intent.output);
      return buyerIntent.nlp || "Neutral";
    }
  } catch (error) {
    console.error("Error extracting sentiment:", error);
  }
  return "Neutral";
};

// Extract topics from insights data
const extractTopics = (insightsData) => {
  try {
    if (insightsData.custom_rag_analysis && insightsData.custom_rag_analysis.output) {
      const customRag = JSON.parse(insightsData.custom_rag_analysis.output);
      // Convert object keys to topics
      return Object.keys(customRag) || [];
    }
  } catch (error) {
    console.error("Error extracting topics:", error);
  }
  return [];
};
