import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import axios from 'axios';
import { config } from '../../lib/config';

/**
 * Server-side proxy for Google Cloud Vision API
 * This helps avoid CORS issues and keeps the API key more secure
 */
export async function POST(request: typeof ExpoRequest): Promise<typeof ExpoResponse> {
  try {
    // Get the image data from the request
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return new ExpoResponse(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
    return new ExpoResponse(
      JSON.stringify(response.data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Vision API proxy error:', error);
    
    // Return error details for debugging
    return new ExpoResponse(
      JSON.stringify({ 
        error: 'Vision API error', 
        message: error.message,
        status: error.response?.status,
        details: error.response?.data
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
