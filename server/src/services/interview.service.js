import Interview from '../models/Interview.model.js';
import { askGemini } from './gemini.service.js';
import { generateAudio } from './murf.service.js';
import { parseGeminiJSON } from '../utils/prompts.utils.js';
import { buildConversationHistory } from '../constants/prompts.js';
import {
  GENERATE_QUESTIONS_PROMPT,
  INTERVIEW_GREETING_PROMPT,
  FOLLOW_UP_PROMPT,
  FEEDBACK_PROMPT,
  EVALUATE_CODE_PROMPT,
} from '../constants/prompts.js';

const normalizeRoleKey = (role) =>
  (role || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getFallbackCodeLanguage = (role) => {
  const normalizedRole = normalizeRoleKey(role);

  if (normalizedRole.includes('python')) {
    return 'python';
  }

  if (normalizedRole.includes('java')) {
    return 'java';
  }

  return 'javascript';
};

const buildFallbackQuestions = (role, totalQuestions) => {
  const normalizedRole = role || 'the role you selected';
  const codeLanguage = getFallbackCodeLanguage(normalizedRole);

  const codeQuestionByRole = {
    frontend: {
      text: 'Write a function that debounces a search input so it only fires after the user stops typing.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage: 'javascript',
    },
    react: {
      text: 'Write a small React helper or component that keeps track of a form field and validates it on change.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage: 'javascript',
    },
    backend: {
      text: 'Write a function that paginates an array of results and returns the current page plus metadata.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage,
    },
    full: {
      text: 'Write a function or helper that validates request data before it is sent to an API endpoint.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage,
    },
    data: {
      text: 'Write a query or function that calculates the average value for each group in a dataset.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage: 'sql',
    },
    devops: {
      text: 'Write a script or command sequence that checks whether a service is healthy and reports the result.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage: 'bash',
    },
    python: {
      text: 'Write a Python function that filters and transforms a list of records into a summary result.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage: 'python',
    },
    java: {
      text: 'Write a Java method that validates input and returns a cleaned result.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage: 'java',
    },
    default: {
      text: 'Write a function that removes duplicate values from an array while keeping the original order.',
      type: 'technical',
      isCodeQuestion: true,
      codeType: 'write',
      codeLanguage,
    },
  };

  const roleKey = normalizeRoleKey(normalizedRole);
  const codeQuestion =
    roleKey.includes('frontend')
      ? codeQuestionByRole.frontend
      : roleKey.includes('react')
        ? codeQuestionByRole.react
        : roleKey.includes('backend')
          ? codeQuestionByRole.backend
          : roleKey.includes('full stack') || roleKey.includes('fullstack')
            ? codeQuestionByRole.full
            : roleKey.includes('data')
              ? codeQuestionByRole.data
              : roleKey.includes('devops')
                ? codeQuestionByRole.devops
                : roleKey.includes('python')
                  ? codeQuestionByRole.python
                  : roleKey.includes('java')
                    ? codeQuestionByRole.java
                    : codeQuestionByRole.default;

  const fallbackQuestions = [
    {
      text: `Can you walk me through a project from your resume that is most relevant to the ${normalizedRole} role?`,
      type: 'behavioral',
      isCodeQuestion: false,
    },
    {
      text: 'What is one technical decision you made on that project that improved its quality or reliability?',
      type: 'technical',
      isCodeQuestion: false,
    },
    codeQuestion,
    {
      text: 'How do you handle feedback, changing priorities, or disagreement on a team?',
      type: 'behavioral',
      isCodeQuestion: false,
    },
    {
      text: 'What would you improve if you had another day to work on that project?',
      type: 'behavioral',
      isCodeQuestion: false,
    },
    {
      text: 'How do you test or validate your work before shipping it?',
      type: 'technical',
      isCodeQuestion: false,
    },
    {
      text: 'What tradeoffs did you consider between speed, maintainability, and quality?',
      type: 'technical',
      isCodeQuestion: false,
    },
  ];

  const requiredQuestions = Math.max(Number(totalQuestions || 5) - 1, 0);

  return fallbackQuestions.slice(0, requiredQuestions);
};

const isGeminiUnavailableError = (error) =>
  error?.isGeminiQuotaError ||
  error?.statusCode === 503 ||
  error?.status === 429 ||
  error?.code === 429 ||
  /quota|resource_exhausted|rate limit|AI service is currently unavailable/i.test(error?.message || '');

const buildFallbackGreeting = (role) =>
  `I'm Natalie, and I'll be conducting your ${role} interview today. Take your time, and let's start with the basics - tell me about yourself.`;

const buildFallbackFollowUp = () => 'Thanks, that is helpful. Let\'s move on to the next one.';

const buildFallbackCodeEvaluation = (codeType) => ({
  isCorrect: false,
  score: 60,
  feedback:
    codeType === 'fix'
      ? 'The submission was recorded, but I could not fully validate the bug fix because the AI service was unavailable.'
      : codeType === 'explain'
        ? 'The submission was recorded, but I could not fully verify the explanation because the AI service was unavailable.'
        : 'The submission was recorded, but I could not fully review the solution because the AI service was unavailable.',
  suggestions: 'Add a short explanation of your approach and mention edge cases or tests you would run.',
});

const buildFallbackFeedback = (role) => ({
  overallScore: 70,
  categoryScores: {
    communicationSkills: {
      score: 72,
      comment: 'You communicated your experience clearly and kept the interview moving.',
    },
    technicalKnowledge: {
      score: 68,
      comment: 'You showed relevant technical awareness, with room to add more depth and examples.',
    },
    problemSolving: {
      score: 70,
      comment: 'Your answers suggested a practical approach to problem-solving.',
    },
    codeQuality: {
      score: 65,
      comment: 'Your code submissions were saved, but a full AI review was not available.',
    },
    confidence: {
      score: 74,
      comment: 'You answered with steady pacing and a professional tone.',
    },
  },
  strengths: [
    'You completed the interview and shared relevant experience.',
    'You stayed engaged and moved through the questions consistently.',
  ],
  areasOfImprovement: [
    'Use more concrete examples and outcomes when describing your work.',
    'Call out tradeoffs, testing, or edge cases more explicitly.',
  ],
  finalAssessment: `Your ${role} interview was completed successfully, but detailed AI scoring was unavailable because the service hit its quota limit. The interview flow and responses were still saved, so you can review them as usual.`,
});

export const startInterview = async (userId, role, resumeText, totalQuestions) => {
  try {
    const questionCount = totalQuestions || 5;

    // Generate questions from the resume
    const questionsPrompt = GENERATE_QUESTIONS_PROMPT(role, resumeText, questionCount);
    let questionsResponse = null;

    try {
      questionsResponse = await askGemini(questionsPrompt);
    } catch (error) {
      if (!isGeminiUnavailableError(error)) {
        throw error;
      }
    }

    const parsedQuestions = questionsResponse ? parseGeminiJSON(questionsResponse) : null;
    const interviewQuestions =
      Array.isArray(parsedQuestions) && parsedQuestions.length > 0
        ? parsedQuestions
        : buildFallbackQuestions(role, questionCount);

    if (!Array.isArray(interviewQuestions) || interviewQuestions.length === 0) {
      throw new Error('Failed to generate interview questions');
    }

    // Create the greeting
    const greetingPrompt = INTERVIEW_GREETING_PROMPT(role, 'Candidate');
    let greetingResponse = null;

    try {
      greetingResponse = await askGemini(greetingPrompt);
    } catch (error) {
      if (!isGeminiUnavailableError(error)) {
        throw error;
      }
    }

    const greeting = greetingResponse || buildFallbackGreeting(role);

    // Generate audio for the greeting
    let audioBase64 = null;
    try {
      audioBase64 = await generateAudio(greeting);
    } catch (audioError) {
      console.warn('Audio generation failed, continuing without audio:', audioError.message);
    }

    // Create the interview document
    const interview = new Interview({
      userId,
      role,
      resumeText,
      totalQuestions: interviewQuestions.length + 1,
      currentQuestion: 1,
      questions: interviewQuestions,
      messages: [
        {
          role: 'interviewer',
          content: greeting,
          timestamp: new Date(),
        },
      ],
      status: 'in_progress',
      lastAudio: audioBase64 || '',
    });

    await interview.save();

    const introQuestion = 'Tell me about yourself';

    return {
      interviewId: interview._id,
      greeting,
      currentQuestion: 1,
      totalQuestions: interviewQuestions.length + 1,
      question: introQuestion,
      audio: audioBase64,
    };
  } catch (error) {
    console.error('Start Interview Error:', error.message);
    throw new Error('Failed to start interview: ' + error.message);
  }
};

export const submitAnswer = async (interviewId, candidateAnswer) => {
  try {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }

    if (!candidateAnswer || !candidateAnswer.trim()) {
      throw new Error('Answer cannot be empty');
    }

    const trimmedAnswer = candidateAnswer.trim();

    // Store the candidate's answer
    interview.messages.push({
      role: 'candidate',
      content: trimmedAnswer,
      timestamp: new Date(),
    });

    // Check if this is the last question
    const isLastQuestion = interview.currentQuestion >= interview.totalQuestions;

    let nextQuestion = null;
    let followUpText = null;
    let audioBase64 = null;

    if (!isLastQuestion) {
      // Build conversation history for context
      const conversationHistory = buildConversationHistory(interview.messages);

      // Get the next question from the list
      const qIndex = interview.currentQuestion;
      nextQuestion = interview.questions[qIndex - 1] || null;

      // Generate a follow-up transition
      const followUpPrompt = FOLLOW_UP_PROMPT(interview.role, conversationHistory, nextQuestion?.text);
      try {
        followUpText = await askGemini(followUpPrompt);
      } catch (error) {
        if (!isGeminiUnavailableError(error)) {
          throw error;
        }

        followUpText = buildFallbackFollowUp();
      }

      // Store the interviewer's response
      interview.messages.push({
        role: 'interviewer',
        content: followUpText,
        timestamp: new Date(),
      });

      // Generate audio for the follow-up
      try {
        audioBase64 = await generateAudio(followUpText);
      } catch (audioError) {
        console.warn('Audio generation failed:', audioError);
      }

      interview.lastAudio = audioBase64 || '';

      interview.currentQuestion += 1;
    } else {
      // Interview is complete
      interview.status = 'completed';
    }

    await interview.save();

    return {
      success: true,
      nextQuestion,
      followUp: followUpText,
      audio: audioBase64,
      isComplete: isLastQuestion,
      currentQuestion: interview.currentQuestion,
      totalQuestions: interview.totalQuestions,
    };
  } catch (error) {
    console.error('Submit Answer Error:', error.message);
    throw new Error('Failed to submit answer. Please try again.');
  }
};

export const submitCode = async (interviewId, code, language) => {
  try {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }

    if (!code || !code.trim()) {
      throw new Error('Code cannot be empty');
    }

    const trimmedCode = code.trim();

    // Get the current question to evaluate against
    const qIndex = interview.currentQuestion - 1;
    const currentQuestion = interview.questions[qIndex];

    if (!currentQuestion?.isCodeQuestion) {
      throw new Error('Current question is not a code question');
    }

    // Evaluate the code
    const evaluationPrompt = EVALUATE_CODE_PROMPT(
      currentQuestion.text,
      trimmedCode,
      language,
      currentQuestion.codeType
    );
    let evaluationResponse = null;
    let evaluation = null;

    try {
      evaluationResponse = await askGemini(evaluationPrompt);
      evaluation = parseGeminiJSON(evaluationResponse);
    } catch (error) {
      if (!isGeminiUnavailableError(error)) {
        throw error;
      }

      evaluation = buildFallbackCodeEvaluation(currentQuestion.codeType);
    }

    if (!evaluation) {
      evaluation = buildFallbackCodeEvaluation(currentQuestion.codeType);
    }

    // Store the code submission
    interview.codeSubmissions.push({
      questionIndex: qIndex,
      code: trimmedCode,
      language,
      evaluation,
      timestamp: new Date(),
    });

    // Store completion of this question
    interview.messages.push({
      role: 'candidate',
      content: `[Code submitted]\n${trimmedCode}`,
      timestamp: new Date(),
    });

    // Check if this is the last question
    const isLastQuestion = interview.currentQuestion >= interview.totalQuestions;

    let nextQuestion = null;
    let followUpText = null;
    let audioBase64 = null;

    if (!isLastQuestion) {
      // Get the next question
      const nextQIndex = interview.currentQuestion;
      nextQuestion = interview.questions[nextQIndex - 1] || null;

      // Generate follow-up
      const conversationHistory = buildConversationHistory(interview.messages);
      const followUpPrompt = FOLLOW_UP_PROMPT(interview.role, conversationHistory, nextQuestion?.text);
      try {
        followUpText = await askGemini(followUpPrompt);
      } catch (error) {
        if (!isGeminiUnavailableError(error)) {
          throw error;
        }

        followUpText = buildFallbackFollowUp();
      }

      interview.messages.push({
        role: 'interviewer',
        content: followUpText,
        timestamp: new Date(),
      });

      try {
        audioBase64 = await generateAudio(followUpText);
      } catch (audioError) {
        console.warn('Audio generation failed:', audioError);
      }

      interview.lastAudio = audioBase64 || '';

      interview.currentQuestion += 1;
    } else {
      interview.status = 'completed';
    }

    await interview.save();

    return {
      success: true,
      evaluation,
      nextQuestion,
      followUp: followUpText,
      audio: audioBase64,
      isComplete: isLastQuestion,
      currentQuestion: interview.currentQuestion,
      totalQuestions: interview.totalQuestions,
    };
  } catch (error) {
    console.error('Submit Code Error:', error.message);
    throw new Error('Failed to evaluate code. Please try again.');
  }
};

export const endInterview = async (interviewId) => {
  try {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }

    // If feedback already exists, return it (idempotent)
    if (interview.feedback) {
      return {
        success: true,
        feedback: interview.feedback,
        overallScore: interview.overallScore,
      };
    }

    // Build the full conversation history
    const conversationHistory = buildConversationHistory(interview.messages);

    // Format code submissions for feedback
    let codeSubmissionsText = '';
    if (interview.codeSubmissions.length > 0) {
      codeSubmissionsText = interview.codeSubmissions
        .map(
          (sub) =>
            `Question ${sub.questionIndex + 1}: ${sub.language}\nCode: ${sub.code}\nEvaluation: ${JSON.stringify(sub.evaluation)}`
        )
        .join('\n\n');
    }

    // Generate feedback
    const feedbackPrompt = FEEDBACK_PROMPT(interview.role, conversationHistory, codeSubmissionsText);
    let feedbackResponse = null;
    let feedback = null;

    try {
      feedbackResponse = await askGemini(feedbackPrompt);
      feedback = parseGeminiJSON(feedbackResponse);
    } catch (error) {
      if (!isGeminiUnavailableError(error)) {
        throw error;
      }

      feedback = buildFallbackFeedback(interview.role);
    }

    if (!feedback) {
      feedback = buildFallbackFeedback(interview.role);
    }

    interview.feedback = feedback;
    interview.overallScore = feedback?.overallScore || 0;
    interview.status = 'completed';

    await interview.save();

    return {
      success: true,
      feedback,
      overallScore: interview.overallScore,
    };
  } catch (error) {
    console.error('End Interview Error:', error.message);
    throw new Error('Failed to end interview. Please try again.');
  }
};

export const getInterviewById = async (interviewId) => {
  try {
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }

    return {
      _id: interview._id,
      role: interview.role,
      currentQuestion: interview.currentQuestion,
      totalQuestions: interview.totalQuestions,
      questions: interview.questions,
      status: interview.status,
      feedback: interview.feedback,
      overallScore: interview.overallScore,
      codeSubmissions: interview.codeSubmissions,
      lastAudio: interview.lastAudio,
      latestInterviewerMessage:
        [...interview.messages].reverse().find((msg) => msg.role === 'interviewer')?.content || '',
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    };
  } catch (error) {
    console.error('Get Interview Error:', error.message);
    throw new Error('Failed to fetch interview.');
  }
};
