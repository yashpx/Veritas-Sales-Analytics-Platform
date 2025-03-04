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
 * Save transcription to Supabase
 * @param {number} callId - Call ID to associate with transcription
 * @param {object} transcription - Transcription data
 * @returns {Promise} - Promise with saved transcription data
 */
export const saveTranscription = async (callId, transcription) => {
  try {
    // First check if a transcription already exists for this call
    const { data: existingData, error: existingError } = await supabase
      .from('call_transcription')
      .select('id')
      .eq('call_id', callId)
      .maybeSingle();
    
    if (existingError) throw existingError;
    
    // Convert transcription object to JSON string for storage
    const transcriptionJson = JSON.stringify(transcription);
    
    let result;
    
    if (existingData) {
      // Update existing transcription
      const { data, error } = await supabase
        .from('call_transcription')
        .update({ call_transcription: transcriptionJson })
        .eq('id', existingData.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new transcription
      const { data, error } = await supabase
        .from('call_transcription')
        .insert([{ 
          call_id: callId,
          call_transcription: transcriptionJson
        }])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return result;
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
    const { data, error } = await supabase
      .from('call_transcription')
      .select('call_transcription')
      .eq('call_id', callId)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) {
      return null; // No transcription found
    }
    
    // Parse the JSON string back to an object
    try {
      return JSON.parse(data.call_transcription);
    } catch (parseError) {
      console.error('Error parsing transcription JSON:', parseError);
      return data.call_transcription; // Return as string if parsing fails
    }
  } catch (error) {
    console.error(`Error fetching transcription for call ID ${callId}:`, error);
    throw error;
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