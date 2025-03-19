# Audio-Transcription Backend Endpoints

To fully implement server-side file storage, these endpoints would need to be created in the backend:

## 1. Save Audio File
```
POST /api/save-audio
Content-Type: multipart/form-data

Form data:
- file: [audio file]
- callId: [call ID]
- timestamp: [timestamp]
```

## 2. Save Transcription
```
POST /api/save-transcription  
Content-Type: multipart/form-data

Form data:
- file: [transcription JSON file]
- callId: [call ID]
- timestamp: [timestamp]
```

## 3. Get Audio File
```
GET /api/audio/:callId
```

## 4. Get Transcription
```
GET /api/transcription/:callId
```

## Implementation Notes

Currently these are mocked through client-side localStorage and file downloads. To fully implement:

1. Create these endpoints in the backend/ directory
2. Set up proper file storage in the audio-files/ and transcriptions/ directories
3. Update the frontend to use these APIs instead of localStorage

The client-side implementation includes mechanisms to store metadata about files in localStorage for tracking purposes.
