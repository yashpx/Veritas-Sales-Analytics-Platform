import supabase from './supabaseClient';

/**
 * Fetch all call logs with related data (sales rep and customer)
 * @returns {Promise} - Promise with call logs data
 */
export const fetchCallLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select(`
        call_id,
        call_date,
        duration_minutes,
        call_outcome,
        notes,
        sales_rep_id (id, name),
        customer_id (id, name, company)
      `)
      .order('call_date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(call => ({
      id: call.call_id,
      date: call.call_date,
      salesRep: call.sales_rep_id ? call.sales_rep_id.name : 'Unknown',
      client: call.customer_id ? call.customer_id.company : 'Unknown',
      duration: call.duration_minutes,
      outcome: call.call_outcome,
      notes: call.notes,
      salesRepId: call.sales_rep_id ? call.sales_rep_id.id : null,
      customerId: call.customer_id ? call.customer_id.id : null
    }));
  } catch (error) {
    console.error('Error fetching call logs:', error);
    throw error;
  }
};

/**
 * Fetch a specific call log by ID with related data
 * @param {number} callId - The ID of the call to fetch
 * @returns {Promise} - Promise with call log data
 */
export const fetchCallById = async (callId) => {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select(`
        call_id,
        call_date,
        duration_minutes,
        call_outcome,
        notes,
        sales_rep_id (id, name),
        customer_id (id, name, company)
      `)
      .eq('call_id', callId)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.call_id,
      date: data.call_date,
      salesRep: data.sales_rep_id ? data.sales_rep_id.name : 'Unknown',
      client: data.customer_id ? data.customer_id.company : 'Unknown',
      duration: data.duration_minutes,
      outcome: data.call_outcome,
      notes: data.notes,
      salesRepId: data.sales_rep_id ? data.sales_rep_id.id : null,
      customerId: data.customer_id ? data.customer_id.id : null
    };
  } catch (error) {
    console.error(`Error fetching call ID ${callId}:`, error);
    throw error;
  }
};

/**
 * Save transcription to a local file
 * @param {number} callId - Call ID to associate with transcription
 * @param {object} transcription - Transcription data
 * @returns {Promise} - Promise with saved transcription data
 */
export const saveTranscription = async (callId, transcription) => {
  try {
    // Convert transcription object to JSON string for storage
    const transcriptionJson = JSON.stringify(transcription);
    
    // For browser environment, we can't directly write to filesystem
    // So we'll create a Blob and trigger a download to save the file locally
    const blob = new Blob([transcriptionJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcription_${callId}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Store in localStorage for easy retrieval
    try {
      localStorage.setItem(`transcription_${callId}`, transcriptionJson);
      console.log(`Transcription saved to localStorage for call ${callId}`);
    } catch (storageError) {
      console.warn('Could not save to localStorage, file only downloaded:', storageError);
    }
    
    return { 
      success: true, 
      call_id: callId,
      message: 'Transcription saved locally'
    };
  } catch (error) {
    console.error('Error saving transcription:', error);
    throw error;
  }
};

/**
 * Fetch transcription for a specific call
 * @param {number} callId - Call ID to get transcription for
 * @returns {Promise} - Promise with transcription data
 */
export const fetchTranscription = async (callId) => {
  try {
    // Try to get from localStorage first
    const localData = localStorage.getItem(`transcription_${callId}`);
    
    if (localData) {
      try {
        console.log(`Transcription found in localStorage for call ${callId}`);
        return JSON.parse(localData);
      } catch (parseError) {
        console.error('Error parsing transcription JSON from localStorage:', parseError);
        return null; // Return null if parsing fails
      }
    }
    
    // If not in localStorage, return null - we'll handle file selection in the UI
    return null;
  } catch (error) {
    console.error(`Error fetching transcription for call ID ${callId}:`, error);
    return null;
  }
};

/**
 * Upload audio file to Supabase storage
 * @param {File} audioFile - Audio file to upload
 * @param {number} callId - Call ID to associate with audio
 * @returns {Promise} - Promise with uploaded file data
 */
export const uploadCallAudio = async (audioFile, callId) => {
  try {
    const fileExt = audioFile.name.split('.').pop();
    const fileName = `call_${callId}_${Date.now()}.${fileExt}`;
    const filePath = `call-recordings/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('calls-audio')
      .upload(filePath, audioFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('calls-audio')
      .getPublicUrl(filePath);
    
    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
};

/**
 * Get audio file URL for a specific call
 * @param {number} callId - Call ID to get audio for
 * @returns {Promise} - Promise with audio file URL
 */
export const getCallAudioUrl = async (callId) => {
  try {
    const { data, error } = await supabase.storage
      .from('calls-audio')
      .list('call-recordings', {
        search: `call_${callId}_`
      });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return null; // No audio file found
    }
    
    // Get the public URL for the first matching file
    const { data: urlData } = supabase.storage
      .from('calls-audio')
      .getPublicUrl(`call-recordings/${data[0].name}`);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error getting audio URL for call ID ${callId}:`, error);
    throw error;
  }
};