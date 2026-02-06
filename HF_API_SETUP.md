# Environment Variables Configuration

This file contains environment variables needed for the AgriSahayak application.

## Hugging Face API Configuration

To enable the Plant Disease Detection feature with the Hugging Face Inference API:

1. Create a `.env.local` file in the root directory of your project
2. Add the following variable:

```
VITE_HF_API_KEY=your_hugging_face_api_key_here
```

### How to Get Your Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co)
2. Sign up or log in to your account
3. Navigate to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token" button
5. Create a token with "read" permissions
6. Copy the token and paste it in your `.env.local` file

### Using the Plant Disease Classification Model

The application uses the `keremberke/plant-disease-classification` model from Hugging Face for disease detection.

**Model Details:**
- Model ID: `keremberke/plant-disease-classification`
- Purpose: Multi-class plant disease classification
- Input: JPEG, PNG images
- Output: Class predictions with confidence scores

**Supported Disease Classes:**
- Apple diseases (Black rot, Cedar apple rust, Scab)
- Leaf spots
- Powdery mildew
- Rust diseases
- Blight diseases
- Mosaic virus
- Anthracnose
- Healthy plants

### API Endpoint

The application calls:
```
https://api-inference.huggingface.co/models/keremberke/plant-disease-classification
```

With a POST request containing:
- **Headers:**
  - `Authorization: Bearer {VITE_HF_API_KEY}`
  - `Content-Type: application/octet-stream`
- **Body:** Raw image bytes

### Response Format

The API returns an array of predictions:
```json
[
  {
    "label": "Apple___Black_rot",
    "score": 0.9542
  },
  {
    "label": "apple___healthy",
    "score": 0.0458
  }
]
```

## Other Environment Variables

### Weather API (Optional)

```
VITE_OPENWEATHER_KEY=your_openweather_api_key
```

Get it from: [OpenWeather API](https://openweathermap.org/api)

### Plant.id API (Legacy - Optional)

```
VITE_PLANT_ID_KEY=your_plant_id_api_key
```

Get it from: [Plant.id](https://plant.id)

## Fallback Behavior

If the Hugging Face API key is not configured:
- The application will use offline mock detection
- Results will be randomly selected from the disease database
- A warning will be displayed to users about offline mode
- The feature remains fully functional for testing and offline use

## Security Notes

- **Never** commit `.env.local` to version control
- Keep your API keys confidential
- Use strong tokens with minimal required permissions
- Rotate tokens periodically
- Monitor API usage for unauthorized access

## Example .env.local File

```
# Hugging Face API for plant disease detection
VITE_HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx

# OpenWeather API for weather information
VITE_OPENWEATHER_KEY=xxxxxxxxxxxxxxxxxxxx

# Plant.id API for alternate disease detection
VITE_PLANT_ID_KEY=xxxxxxxxxxxxxxxxxxxx
```

## Troubleshooting

### "API Key not configured" Message
- Ensure `.env.local` file exists in the root directory
- Variable name must be exactly `VITE_HF_API_KEY`
- Restart the development server after adding `.env.local`

### "Model is loading" Error (503)
- Model is being initialized on first use
- Wait 30-60 seconds and try again
- This is normal for first-time requests to Hugging Face

### "Authentication failed" Error (401)
- Check your API key is correct and copied entirely
- Verify the token has "read" permissions
- Create a new token if the old one is invalid

### Slow Response Times
- First API call may be slow as the model loads
- Subsequent calls are faster
- Check your internet connection
- Ensure Hugging Face API status is operational

## Development vs Production

### Development
- Use free tier tokens from Hugging Face
- Test with small image files
- Monitor API call quotas

### Production
- Consider upgrading to Hugging Face Pro for better rate limits
- Implement request caching if possible
- Monitor usage and costs
- Have fallback detection ready
