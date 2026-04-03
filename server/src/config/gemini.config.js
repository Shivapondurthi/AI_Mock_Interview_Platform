import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-2.0-flash";

const generateContent = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No response from Gemini");
    }

    const textContent = response.candidates[0].content.parts
      .filter((part) => part.text)
      .map((part) => part.text)
      .join("");

    return textContent;
  } catch (error) {
    const statusCode = error?.status === 429 || error?.code === 429 ? 503 : 500;
    const wrappedError = new Error(`Gemini API failed: ${error.message}`);

    wrappedError.statusCode = statusCode;
    wrappedError.isGeminiQuotaError = statusCode === 503;

    console.error("Gemini API Error:", error.message);
    throw wrappedError;
  }
};

export { generateContent };