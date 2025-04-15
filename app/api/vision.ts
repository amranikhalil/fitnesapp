import axios from 'axios';
import { config } from '../../lib/config';

/**
 * Server-side proxy for Google Cloud Vision API
 * This helps avoid CORS issues and keeps the API key more secure
 */
export async function POST(request) {
  try {
    // Get the image data from the request
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return Response.json({ error: 'No image data provided' }, { status: 400 });
    }
    
    // Prepare the request to Google Cloud Vision API
    const apiKey = config.googleCloudVisionApiKey;
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const requestData = {
      requests: [
        {
          image: {
            content: imageBase64.split('base64,')[1] // Remove the data:image/jpeg;base64, part if present
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            }
          ]
        }
      ]
    };
    
    // Make the API request
    const response = await axios.post(apiUrl, requestData);
    
    // Return the API response
    return Response.json(response.data);
  } catch (error) {
    console.error('Error with Vision API:', error);
    
    // Return error response
    return Response.json({ error: 'Failed to process image' }, { status: 500 });
  }
}

// Add a default export for expo-router
export default {
  POST
};
