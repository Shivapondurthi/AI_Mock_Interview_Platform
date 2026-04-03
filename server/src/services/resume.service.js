import Resume from '../models/Resume.model.js';
import pdfParse from 'pdf-parse';

export const uploadResume = async (userId, file) => {
  try {
    let extractedText = '';

    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      extractedText = data.text;
    } else {
      extractedText = file.buffer.toString('utf-8');
    }

    const existingResume = await Resume.findOne({ userId });

    if (existingResume) {
      existingResume.fileName = file.originalname;
      existingResume.extractedText = extractedText;
      await existingResume.save();
      return existingResume;
    }

    const resume = new Resume({
      userId,
      fileName: file.originalname,
      extractedText,
    });

    await resume.save();
    return resume;
  } catch (error) {
    console.error('Resume Upload Service Error:', error.message);
    throw new Error('Failed to process resume. Please try again.');
  }
};

export const getResumeByUserId = async (userId) => {
  try {
    const resume = await Resume.findOne({ userId });
    return resume;
  } catch (error) {
    console.error('Get Resume Error:', error.message);
    throw new Error('Failed to fetch resume.');
  }
};

export const deleteResumeByUserId = async (userId) => {
  try {
    await Resume.deleteOne({ userId });
  } catch (error) {
    console.error('Delete Resume Error:', error.message);
    throw new Error('Failed to delete resume.');
  }
};
