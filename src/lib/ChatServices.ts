const API_KEY = 'AIzaSyAWsP2BEuQ6QxVVoL-5-x4HvQiqqIl9MzY';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const chatService = {
  sendMessage: async (userMessage) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: userMessage
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
};

export { chatService };