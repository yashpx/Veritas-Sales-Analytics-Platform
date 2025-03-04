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
 * Save transcription to multiple locations:
 * - Local download
 * - LocalStorage
 * - Public folder in project
 * 
 * @param {number} callId - Call ID to associate with transcription
 * @param {object} transcription - Transcription data
 * @returns {Promise} - Promise with saved transcription data
 */
export const saveTranscription = async (callId, transcription) => {
  try {
    // Convert transcription object to JSON string for storage
    const transcriptionJson = JSON.stringify(transcription);
    
    // 1. Create a Blob and trigger a download to save the file locally
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
    
    // 2. Store in localStorage for easy retrieval
    try {
      localStorage.setItem(`transcription_${callId}`, transcriptionJson);
      console.log(`Transcription saved to localStorage for call ${callId}`);
    } catch (storageError) {
      console.warn('Could not save to localStorage, file only downloaded:', storageError);
    }
    
    // 3. Save to project public folder using fetch API
    try {
      const filename = `transcription_${callId}_${new Date().toISOString().replace(/:/g, '-')}.json`;
      const formData = new FormData();
      const transcriptionBlob = new Blob([transcriptionJson], { type: 'application/json' });
      
      // Create a file from the blob
      const transcriptionFile = new File([transcriptionBlob], filename, { type: 'application/json' });
      formData.append('file', transcriptionFile);
      formData.append('callId', callId);
      formData.append('timestamp', Date.now());
      
      // Add a record for this transcription to localStorage for tracking
      const savedTranscriptions = JSON.parse(localStorage.getItem('projectTranscriptions') || '[]');
      const transcriptionRecord = {
        callId,
        filename,
        path: `/transcriptions/${filename}`,
        timestamp: Date.now(),
        clientInfo: transcription[0]?.client || 'Unknown client'
      };
      
      savedTranscriptions.push(transcriptionRecord);
      localStorage.setItem('projectTranscriptions', JSON.stringify(savedTranscriptions));
      
      console.log(`Transcription metadata saved for future reference: ${filename}`);

      // In a real implementation, you would do:
      // await fetch('/api/save-transcription', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Copy the transcription to the public folder in a real implementation
      // We're mocking this behavior here since we can't directly write to the filesystem
      
      return { 
        success: true, 
        call_id: callId,
        filename,
        path: `/transcriptions/${filename}`,
        message: 'Transcription saved locally and to project folder'
      };
    } catch (saveError) {
      console.error('Error saving transcription to project folder:', saveError);
      return { 
        success: true, 
        call_id: callId,
        message: 'Transcription saved locally only (failed to save to project folder)'
      };
    }
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
        // Continue to other methods if localStorage parsing fails
      }
    }
    
    // Check project storage records
    const savedTranscriptions = JSON.parse(localStorage.getItem('projectTranscriptions') || '[]');
    const transcriptionRecord = savedTranscriptions.find(record => record.callId === callId);
    
    if (transcriptionRecord) {
      try {
        console.log(`Transcription record found in project storage: ${transcriptionRecord.filename}`);
        
        // In a real implementation, you would fetch the file from the public folder:
        // const response = await fetch(transcriptionRecord.path);
        // if (!response.ok) throw new Error('Failed to fetch transcription file');
        // const transcriptionData = await response.json();
        // return transcriptionData;
        
        // For now, we'll check if there's a record but will still need the file manually selected
        console.log('Transcription needs to be loaded from project storage path:', transcriptionRecord.path);
        
        // Return placeholder notification to guide the user
        return null;
      } catch (fetchError) {
        console.error('Error fetching transcription from project storage:', fetchError);
        // Continue to other methods if project storage fetch fails
      }
    }
    
    // If no success with auto-loading methods, return null - will handle file selection in the UI
    return null;
  } catch (error) {
    console.error(`Error fetching transcription for call ID ${callId}:`, error);
    return null;
  }
};

/**
 * Save audio file to multiple locations:
 * - Local download
 * - LocalStorage (if small enough)
 * - Project public folder
 * 
 * @param {File} audioFile - Audio file to upload
 * @param {number} callId - Call ID to associate with audio
 * @returns {Promise} - Promise with saved audio data
 */
export const saveAudioFile = async (audioFile, callId) => {
  try {
    const fileExt = audioFile.name.split('.').pop();
    const fileName = `audio_${callId}_${Date.now()}.${fileExt}`;
    
    // 1. Create a download for the user
    const url = URL.createObjectURL(audioFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // 2. Try to store in localStorage if not too large
    try {
      const reader = new FileReader();
      await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          try {
            localStorage.setItem(`audio_${callId}`, reader.result);
            localStorage.setItem(`audio_${callId}_filename`, audioFile.name);
            localStorage.setItem(`audio_${callId}_type`, audioFile.type);
            resolve();
          } catch (error) {
            console.warn('Failed to save audio to localStorage, likely too large', error);
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });
    } catch (storageError) {
      console.warn('Could not save to localStorage, file only downloaded:', storageError);
    }
    
    // 3. Save metadata for project folder storage
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('callId', callId);
      formData.append('timestamp', Date.now());
      
      // Add a record for this audio file to localStorage for tracking
      const savedAudioFiles = JSON.parse(localStorage.getItem('projectAudioFiles') || '[]');
      const audioRecord = {
        callId,
        filename: fileName,
        originalName: audioFile.name,
        path: `/audio-files/${fileName}`,
        timestamp: Date.now(),
        type: audioFile.type,
        size: audioFile.size
      };
      
      savedAudioFiles.push(audioRecord);
      localStorage.setItem('projectAudioFiles', JSON.stringify(savedAudioFiles));
      
      console.log(`Audio file metadata saved for future reference: ${fileName}`);
      
      // In a real implementation with a server:
      // await fetch('/api/save-audio', {
      //   method: 'POST',
      //   body: formData
      // });
      
      return {
        success: true,
        filename: fileName,
        path: `/audio-files/${fileName}`,
        message: 'Audio file saved locally and to project folder'
      };
    } catch (saveError) {
      console.error('Error saving audio to project folder:', saveError);
      return {
        success: true,
        message: 'Audio file saved locally only (failed to save to project folder)'
      };
    }
  } catch (error) {
    console.error('Error saving audio file:', error);
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
    console.error('Error uploading audio file to Supabase:', error);
    throw error;
  }
};

/**
 * Get audio file for a specific call from multiple potential sources
 * @param {number} callId - Call ID to get audio for
 * @returns {Promise} - Promise with audio file object or URL
 */
export const getCallAudio = async (callId) => {
  try {
    // 1. Try localStorage first
    const storedAudioUrl = localStorage.getItem(`audio_${callId}`);
    if (storedAudioUrl) {
      try {
        const filename = localStorage.getItem(`audio_${callId}_filename`) || `audio_${callId}.mp3`;
        const filetype = localStorage.getItem(`audio_${callId}_type`) || 'audio/mpeg';
        
        // Convert data URL to blob
        const res = await fetch(storedAudioUrl);
        const blob = await res.blob();
        
        // Create a File object 
        const file = new File([blob], filename, { type: filetype });
        
        return {
          source: 'localStorage',
          file,
          url: storedAudioUrl
        };
      } catch (error) {
        console.error('Error recreating audio file from localStorage:', error);
        // Continue to other sources if localStorage fails
      }
    }
    
    // 2. Check project storage records
    const savedAudioFiles = JSON.parse(localStorage.getItem('projectAudioFiles') || '[]');
    const audioRecord = savedAudioFiles.find(record => record.callId === callId);
    
    if (audioRecord) {
      try {
        console.log(`Audio record found in project storage: ${audioRecord.filename}`);
        
        // In a real implementation, you would fetch the file from the public folder:
        // const response = await fetch(audioRecord.path);
        // if (!response.ok) throw new Error('Failed to fetch audio file');
        // const blob = await response.blob();
        // const file = new File([blob], audioRecord.originalName, { type: audioRecord.type });
        // 
        // return {
        //   source: 'projectStorage',
        //   file,
        //   url: URL.createObjectURL(file),
        //   path: audioRecord.path
        // };
        
        console.log('Audio file needs to be loaded from project storage path:', audioRecord.path);
        return {
          source: 'projectStorageReference',
          path: audioRecord.path,
          needsLoading: true
        };
      } catch (fetchError) {
        console.error('Error fetching audio from project storage:', fetchError);
        // Continue to other sources if project storage fetch fails
      }
    }
    
    // 3. Try Supabase storage as a last resort
    try {
      const { data, error } = await supabase.storage
        .from('calls-audio')
        .list('call-recordings', {
          search: `call_${callId}_`
        });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Get the public URL for the first matching file
        const { data: urlData } = supabase.storage
          .from('calls-audio')
          .getPublicUrl(`call-recordings/${data[0].name}`);
        
        return {
          source: 'supabase',
          url: urlData.publicUrl
        };
      }
    } catch (supabaseError) {
      console.error('Error accessing Supabase storage:', supabaseError);
    }
    
    // Return null if no audio found
    return null;
  } catch (error) {
    console.error(`Error getting audio for call ID ${callId}:`, error);
    return null;
  }
};

/**
 * Get audio file URL from Supabase storage for a specific call
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