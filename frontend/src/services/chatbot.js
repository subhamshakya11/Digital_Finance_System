import api from './api';

const chatbotService = {
  // Send message to chatbot
  sendMessage: async (message) => {
    const response = await api.post('/chatbot/chat/', { message });
    return response.data;
  },

  // Get chat history
  getHistory: async () => {
    const response = await api.get('/chatbot/history/');
    return response.data;
  },

  // Clear chat history
  clearHistory: async () => {
    const response = await api.delete('/chatbot/clear/');
    return response.data;
  },
};

export default chatbotService;