import * as resumeService from '../services/resume.service.js';

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please select a PDF.' });
    }

    const resume = await resumeService.uploadResume(req.user._id, req.file);

    return res.status(201).json({
      success: true,
      data: {
        resumeId: resume._id,
        fileName: resume.fileName,
        preview: resume.extractedText.substring(0, 500),
        text: resume.extractedText,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getResume = async (req, res, next) => {
  try {
    const resume = await resumeService.getResumeByUserId(req.user._id);

    if (!resume) {
      return res.status(404).json({ success: false, message: 'No resume found. Please upload one.' });
    }

    return res.json({
      success: true,
      data: {
        resumeId: resume._id,
        fileName: resume.fileName,
        preview: resume.extractedText.substring(0, 500),
        text: resume.extractedText,
      },
    });
  } catch (error) {
    next(error);
  }
};