import API from './api.js';

const interviewService = {
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await API.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  getResume: async () => {
    const response = await API.get('/resume');
    return response.data.data;
  },

  startInterview: async (role, resumeText, totalQuestions) => {
    const response = await API.post('/interview/start', {
      role,
      resumeText,
      totalQuestions,
    });
    return response.data.data;
  },

  submitTextAnswer: async (interviewId, answer) => {
    const response = await API.post('/interview/answer', {
      interviewId,
      answer,
    });
    return response.data.data;
  },

  submitVoiceAnswer: async (interviewId, audioBlob) => {
    const formData = new FormData();
    formData.append('interviewId', interviewId);
    formData.append('audio', audioBlob, 'answer.webm');

    const response = await API.post('/interview/answer/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  transcribeAudio: async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await API.post('/interview/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  submitCode: async (interviewId, code, language) => {
    const response = await API.post('/interview/code', {
      interviewId,
      code,
      language,
    });
    return response.data.data;
  },

  endInterview: async (interviewId) => {
    const response = await API.post('/interview/end', {
      interviewId,
    });
    return response.data.data;
  },

  getInterview: async (interviewId) => {
    const response = await API.get(`/interview/${interviewId}`);
    return response.data.data;
  },

  speakText: async (text) => {
    const response = await API.post('/interview/speak', { text }, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default interviewService;
