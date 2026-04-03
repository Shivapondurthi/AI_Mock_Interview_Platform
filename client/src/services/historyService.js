import API from './api.js';

const historyService = {
  getInterviewHistory: async (page = 1, limit = 10) => {
    const response = await API.get(`/history?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  getInterviewDetail: async (interviewId) => {
    const response = await API.get(`/history/${interviewId}`);
    return response.data.data;
  },

  deleteInterview: async (interviewId) => {
    const response = await API.delete(`/history/${interviewId}`);
    return response.data;
  },

  getInterviewStats: async () => {
    const response = await API.get('/history/stats');
    return response.data.data;
  },
};

export default historyService;
