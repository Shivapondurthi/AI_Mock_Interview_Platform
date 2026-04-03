import * as interviewService from '../services/interview.service.js';
import { transcribeAudio } from '../services/assemblyai.service.js';
import { streamAudio } from '../services/murf.service.js';

export const startInterview = async (req, res, next) => {
  try {
    const { role, resumeText, totalQuestions } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Please select a role for the interview.' });
    }

    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Please upload your resume first.' });
    }

    const result = await interviewService.startInterview(
      req.user._id,
      role,
      resumeText,
      totalQuestions || 5
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const submitTextAnswer = async (req, res, next) => {
  try {
    const { interviewId, answer } = req.body;

    if (!interviewId) {
      return res.status(400).json({ success: false, message: 'Interview ID is required.' });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide an answer.' });
    }

    const result = await interviewService.submitAnswer(interviewId, answer.trim());

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const submitVoiceAnswer = async (req, res, next) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId || !req.file) {
      return res.status(400).json({ success: false, message: 'Interview ID and audio file are required.' });
    }

    const transcribedText = await transcribeAudio(req.file.buffer, req.file.originalname);

    const result = await interviewService.submitAnswer(interviewId, transcribedText);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const submitCode = async (req, res, next) => {
  try {
    const { interviewId, code, language } = req.body;

    if (!interviewId) {
      return res.status(400).json({ success: false, message: 'Interview ID is required.' });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide code.' });
    }

    if (!language) {
      return res.status(400).json({ success: false, message: 'Programming language is required.' });
    }

    const result = await interviewService.submitCode(interviewId, code.trim(), language);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const endInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ success: false, message: 'Interview ID is required.' });
    }

    const result = await interviewService.endInterview(interviewId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await interviewService.getInterviewById(id);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const transcribeOnly = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required.' });
    }

    const transcribedText = await transcribeAudio(req.file.buffer, req.file.originalname);

    return res.json({
      success: true,
      data: {
        text: transcribedText,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const speakText = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required.' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');

    await streamAudio(text, res);
  } catch (error) {
    next(error);
  }
};
