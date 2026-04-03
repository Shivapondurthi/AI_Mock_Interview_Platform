import Interview from '../models/Interview.model.js';

export const getUserInterviews = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const interviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id role status overallScore feedback createdAt updatedAt currentQuestion totalQuestions');

    const total = await Interview.countDocuments({ userId });

    return {
      interviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    };
  } catch (error) {
    console.error('Get User Interviews Error:', error.message);
    throw new Error('Failed to fetch interview history.');
  }
};

export const getInterviewDetails = async (interviewId) => {
  try {
    const interview = await Interview.findById(interviewId).select(
      '_id role status overallScore feedback createdAt updatedAt questions messages codeSubmissions'
    );

    if (!interview) {
      throw new Error('Interview not found');
    }

    return interview;
  } catch (error) {
    console.error('Get Interview Details Error:', error.message);
    throw new Error('Failed to fetch interview details.');
  }
};

export const deleteInterview = async (interviewId, userId) => {
  try {
    const result = await Interview.findOneAndDelete({ _id: interviewId, userId });

    if (!result) {
      throw new Error('Interview not found or unauthorized');
    }

    return result;
  } catch (error) {
    console.error('Delete Interview Error:', error.message);
    throw new Error('Failed to delete interview.');
  }
};

export const getUserInterviewStats = async (userId) => {
  try {
    const interviews = await Interview.find({ userId, status: 'completed' });

    const totalInterviews = interviews.length;
    const averageScore =
      interviews.length > 0
        ? interviews.reduce((sum, interview) => sum + (interview.overallScore || 0), 0) / interviews.length
        : 0;

    const roleWiseBreakdown = interviews.reduce((acc, interview) => {
      const existing = acc.find((r) => r.role === interview.role);
      if (existing) {
        existing.count += 1;
        existing.avgScore += interview.overallScore || 0;
      } else {
        acc.push({
          role: interview.role,
          count: 1,
          avgScore: interview.overallScore || 0,
        });
      }
      return acc;
    }, []);

    // Calculate averages
    roleWiseBreakdown.forEach((role) => {
      role.avgScore = Math.round(role.avgScore / role.count);
    });

    return {
      totalInterviews,
      averageScore: Math.round(averageScore),
      roleWiseBreakdown,
    };
  } catch (error) {
    console.error('Get User Interview Stats Error:', error.message);
    throw new Error('Failed to fetch interview statistics.');
  }
};
