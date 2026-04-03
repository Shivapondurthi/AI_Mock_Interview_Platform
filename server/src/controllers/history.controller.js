import * as historyService from '../services/history.service.js';

export const getInterviewHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await historyService.getUserInterviews(req.user._id, page, limit);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewDetailHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await historyService.getInterviewDetails(id);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInterviewHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    await historyService.deleteInterview(id, req.user._id);

    return res.json({
      success: true,
      message: 'Interview deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewStats = async (req, res, next) => {
  try {
    const result = await historyService.getUserInterviewStats(req.user._id);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
