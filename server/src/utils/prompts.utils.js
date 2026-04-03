export const parseGeminiJSON = (text) => {
  try {
    if (!text) {
      console.error('Empty text provided to parseGeminiJSON');
      return null;
    }

    // Try direct JSON parse first
    try {
      return JSON.parse(text);
    } catch (e) {
      // Fallback: extract JSON from markdown/text
    }

    // Extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/) ||
                     text.match(/\[[\s\S]*\]/) ||
                     text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }

    console.error('Could not extract JSON from response:', text.substring(0, 100));
    return null;
  } catch (error) {
    console.error('Error parsing Gemini JSON:', error.message);
    return null;
  }
};

export const buildConversationHistory = (messages) => {
  if (!messages || messages.length === 0) return 'No conversation yet.';

  return messages
    .map((msg) => {
      const role = msg.role === 'interviewer' ? 'Interviewer' : 'Candidate';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');
};

