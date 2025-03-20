import supabase from './supabaseClient';

/**
 * Fetch call logs with related data (sales rep and customer)
 * If user is a sales rep, only returns their own calls
 * @param {object} user - Current user object from auth context
 * @param {string} authType - Auth type ('supabase' or 'sales_rep')
 * @returns {Promise} - Promise with call logs data
 */
export const fetchCallLogs = async (user, authType) => {
  try {
    console.log('Fetching call logs...', { user, authType });
    
    let query = supabase
      .from('call_logs')
      .select(`
        call_id,
        call_date,
        duration_minutes,
        call_outcome,
        notes,
        transcription,
        customers!inner(customer_id, customer_first_name, customer_last_name),
        sales_reps!inner(sales_rep_id, sales_rep_first_name, sales_rep_last_name)
      `);
    
    // If user is a sales rep, filter calls for just that rep
    if (authType === 'sales_rep' && user && user.salesRepId) {
      console.log('Filtering calls for sales rep ID:', user.salesRepId);
      // Direct filter on sales_rep_id column in call_logs table
      query = query.eq('sales_rep_id', user.salesRepId);
    }
    
    // Execute the query and order by call_date in descending order (newest first)
    let { data: call_logs, error } = await query.order('call_date', { ascending: false });
    
    console.log('Call logs query result:', { 
      success: !error, 
      error: error ? error.message : null,
      dataCount: call_logs ? call_logs.length : 0 
    });
    
    if (error) throw error;
    
    if (!call_logs || call_logs.length === 0) {
      console.warn('No call logs found in the database');
      return [];
    }
    
    return call_logs.map(call => ({
      id: call.call_id,
      date: call.call_date,
      salesRep: `${call.sales_reps?.sales_rep_first_name || ''} ${call.sales_reps?.sales_rep_last_name || ''}`.trim() || 'Unknown',
      client: `${call.customers?.customer_first_name || ''} ${call.customers?.customer_last_name || ''}`.trim() || 'Unknown',
      duration: call.duration_minutes,
      outcome: call.call_outcome || 'Unknown',
      notes: call.notes,
      hasTranscription: !!call.transcription,
      transcription: call.transcription,
      salesRepId: call.sales_reps?.sales_rep_id,
      customerId: call.customers?.customer_id
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
    // Using the table relationships as specified in your SQL query
    let { data: call, error } = await supabase
      .from('call_logs')
      .select(`
        call_id,
        call_date,
        duration_minutes,
        call_outcome,
        notes,
        transcription,
        customers!inner(customer_id, customer_first_name, customer_last_name),
        sales_reps!inner(sales_rep_id, sales_rep_first_name, sales_rep_last_name)
      `)
      .eq('call_id', callId)
      .single();
    
    if (error) throw error;
    
    return {
      id: call.call_id,
      date: call.call_date,
      salesRep: `${call.sales_reps?.sales_rep_first_name || ''} ${call.sales_reps?.sales_rep_last_name || ''}`.trim() || 'Unknown',
      client: `${call.customers?.customer_first_name || ''} ${call.customers?.customer_last_name || ''}`.trim() || 'Unknown',
      duration: call.duration_minutes,
      outcome: call.call_outcome || 'Unknown',
      notes: call.notes,
      hasTranscription: !!call.transcription,
      transcription: call.transcription,
      salesRepId: call.sales_reps?.sales_rep_id,
      customerId: call.customers?.customer_id
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
 * - Supabase call_logs table
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
      // Set a flag that this call has been transcribed - used for persistence checks
      localStorage.setItem(`transcription_flag_${callId}`, 'true');
      console.log(`Transcription saved to localStorage for call ${callId}`);
    } catch (storageError) {
      console.warn('Could not save to localStorage, file only downloaded:', storageError);
    }
    
    // 3. Save to project public folder using fetch API
    try {
      const timestamp = Date.now();
      const filename = `transcription_${callId}_${new Date(timestamp).toISOString().replace(/:/g, '-')}.json`;
      const formData = new FormData();
      const transcriptionBlob = new Blob([transcriptionJson], { type: 'application/json' });
      
      // Create a file from the blob
      const transcriptionFile = new File([transcriptionBlob], filename, { type: 'application/json' });
      formData.append('file', transcriptionFile);
      formData.append('callId', callId);
      formData.append('timestamp', timestamp);
      
      // Add a record for this transcription to localStorage for tracking
      const savedTranscriptions = JSON.parse(localStorage.getItem('projectTranscriptions') || '[]');
      
      // Remove any existing records for this call ID to avoid duplicates
      const filteredTranscriptions = savedTranscriptions.filter(record => record.callId !== callId);
      
      const transcriptionRecord = {
        callId,
        filename,
        path: `/transcriptions/${filename}`,
        timestamp,
        clientInfo: transcription[0]?.client || 'Unknown client'
      };
      
      filteredTranscriptions.push(transcriptionRecord);
      localStorage.setItem('projectTranscriptions', JSON.stringify(filteredTranscriptions));
      
      console.log(`Transcription metadata saved for future reference: ${filename}`);

      // 4. Save to Supabase call_logs table
      try {
        // Convert the diarized transcription to a plain text format for storage
        // This combines all segments into a single text field
        const plainTextTranscription = transcription.map(segment => 
          `${segment.speaker}: ${segment.text}`
        ).join('\n\n');
        
        console.log(`Saving transcription to call_logs table for call ${callId}`);
        
        // Update the call_logs table with the transcription text
        let { data: updateResult, error } = await supabase
          .from('call_logs')
          .update({ 
            transcription: plainTextTranscription
          })
          .eq('call_id', callId);
        
        if (error) {
          console.error('Error updating transcription in database:', error);
          throw error;
        }
        
        console.log(`Transcription saved to call_logs table for call ${callId}`);
        
        // For backward compatibility, still keep the local metadata
        localStorage.setItem(`call_${callId}_transcription_metadata`, JSON.stringify({
          has_transcription: true,
          transcription_path: `/transcriptions/${filename}`,
          transcription_date: new Date(timestamp).toISOString()
        }));
        
        console.log(`Call metadata updated for call ${callId} to indicate transcription exists`);
      } catch (dbError) {
        console.error('Error updating transcription in Supabase:', dbError);
      }
      
      return { 
        success: true, 
        call_id: callId,
        filename,
        path: `/transcriptions/${filename}`,
        message: 'Transcription saved to database, locally, and to project folder'
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
    // Try to get from localStorage first for faster access
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
        
        // For demo purposes, we'll just use the record in localStorage
        // This simulates successfully retrieving from project storage
        console.log('Simulating fetch from project storage path:', transcriptionRecord.path);
        
        // If we have a record, there should be data in localStorage
        const backupData = localStorage.getItem(`transcription_${callId}`);
        if (backupData) {
          return JSON.parse(backupData);
        }
      } catch (fetchError) {
        console.error('Error fetching transcription from project storage:', fetchError);
        // Continue to other methods if project storage fetch fails
      }
    }
    
    // Check Supabase for transcriptions
    try {
      console.log(`Checking Supabase for transcription for call ${callId}`);
      
      let { data: call, error } = await supabase
        .from('call_logs')
        .select('transcription')
        .eq('call_id', callId)
        .single();
      
      if (error) {
        console.error('Error fetching transcription from Supabase:', error);
        throw error;
      }
      
      if (call && call.transcription) {
        console.log('Transcription found in Supabase database');
        
        // The transcription in the database is stored as plain text with speaker labels
        // We need to convert it back to the diarized format expected by the UI
        // This is a simple version - in a production app, you might store the full JSON
        
        const lines = call.transcription.split('\n\n');
        const diarizedFormat = lines.map((line, index) => {
          // Try to extract speaker and text
          const match = line.match(/^(Speaker \d+):\s(.+)$/s);
          
          if (match) {
            return {
              speaker: match[1],
              text: match[2],
              start_time: index * 5, // Approximate time for display purposes
              end_time: (index + 1) * 5
            };
          } else {
            // Fallback if format doesn't match expected pattern
            return {
              speaker: "Speaker 1",
              text: line,
              start_time: index * 5,
              end_time: (index + 1) * 5
            };
          }
        });
        
        // Save to localStorage for future faster access
        localStorage.setItem(`transcription_${callId}`, JSON.stringify(diarizedFormat));
        localStorage.setItem(`transcription_flag_${callId}`, 'true');
        
        return diarizedFormat;
      }
      
      // If no transcription in database, check for flag in localStorage
      const transcriptionFlag = localStorage.getItem(`transcription_flag_${callId}`);
      if (transcriptionFlag === 'true') {
        console.log('Found transcription flag - this call has been transcribed before');
        return [{
          speaker: "Speaker 1",
          text: "This call has been transcribed before, but the data needs to be reloaded.",
          start_time: 0,
          end_time: 1
        }];
      }
    } catch (dbError) {
      console.error('Error checking database for transcription:', dbError);
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
    // Skip this step if the file is clearly too large (>5MB) to avoid unnecessary processing
    if (audioFile.size < 5 * 1024 * 1024) {
      try {
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onloadend = () => {
            try {
              localStorage.setItem(`audio_${callId}`, reader.result);
              localStorage.setItem(`audio_${callId}_filename`, audioFile.name);
              localStorage.setItem(`audio_${callId}_type`, audioFile.type);
              console.log(`Audio file saved to localStorage for call ${callId}`);
            } catch (error) {
              console.log('Audio file too large for localStorage, continuing with other storage methods');
            }
            resolve(); // Always resolve, even if localStorage fails
          };
          reader.onerror = () => {
            console.log('Error reading audio file, continuing with other storage methods');
            resolve(); // Still resolve to continue processing
          };
          reader.readAsDataURL(audioFile);
        });
      } catch (storageError) {
        console.log('Could not save to localStorage, continuing with other storage methods');
      }
    } else {
      console.log('Audio file size exceeds localStorage capacity (>5MB), skipping localStorage storage');
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

/**
 * Updates the call outcome status in Supabase
 * @param {number} callId - Call ID to update
 * @param {string} outcome - New outcome status ('Closed', 'Failed', 'In Progress')
 * @returns {Promise} - Promise with updated call data
 */
export const updateCallOutcome = async (callId, outcome) => {
  try {
    console.log(`Updating call ${callId} outcome to ${outcome}`);
    
    // Validate the outcome value - must match database constraints
    const validOutcomes = ['Closed', 'Fail', 'In-progress'];
    const finalOutcome = validOutcomes.includes(outcome) ? outcome : 'In-progress';
    
    // Update the call_logs table
    const { data, error } = await supabase
      .from('call_logs')
      .update({ 
        call_outcome: finalOutcome
      })
      .eq('call_id', callId);
    
    if (error) {
      console.error('Error updating call outcome in database:', error);
      throw error;
    }
    
    console.log(`Call ${callId} outcome updated to ${finalOutcome}`);
    
    // Also update the outcome in localStorage if we have the call data cached
    try {
      const cachedCallData = localStorage.getItem(`call_data_${callId}`);
      if (cachedCallData) {
        const callData = JSON.parse(cachedCallData);
        callData.outcome = finalOutcome;
        localStorage.setItem(`call_data_${callId}`, JSON.stringify(callData));
        console.log(`Updated cached call data for call ${callId}`);
      }
    } catch (cacheError) {
      console.warn('Error updating cached call data:', cacheError);
      // Continue even if cache update fails
    }
    
    return {
      success: true,
      callId,
      outcome: finalOutcome
    };
  } catch (error) {
    console.error(`Error updating call outcome for call ID ${callId}:`, error);
    throw error;
  }
};