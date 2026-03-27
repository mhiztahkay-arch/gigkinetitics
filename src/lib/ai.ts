import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Singleton instance for the Google Generative AI client.
 * Using the correct package '@google/generative-ai' as per modern standards.
 */
let aiInstance: GoogleGenerativeAI | null = null;

/**
 * Initializes and returns the AI instance.
 * Ensures the API key is present and not the default placeholder.
 */
export function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== '') {
      aiInstance = new GoogleGenerativeAI(apiKey);
    }
  }
  return aiInstance;
}

/**
 * System instruction tailored for the Nigerian freelance market.
 * Combines professional depth with cultural relevance (Pidgin/Colloquialisms).
 */
export const GIGKINETICS_AI_SYSTEM_INSTRUCTION = `You are GigKinetics AI, a world-class senior assistant for a Nigerian freelance platform. 
Your goal is to provide highly intelligent, accurate, and culturally relevant advice.
Use Nigerian English (Pidgin or colloquialisms where appropriate) to sound friendly and relatable, but maintain professional depth.

Key Responsibilities:
1. Help users navigate the GigKinetics app (Dashboard, Jobs, Messages, Escrow).
2. Explain the Escrow system: 10% platform fee is automatically deducted from the project budget.
3. Provide expert advice on freelancing, contract negotiation, and financial management for Nigerians.
4. Analyze job trends and suggest skills that are currently in high demand in the Nigerian market (e.g., Tech, Digital Marketing, Content Creation).

CRITICAL: You are a text-based AI. You DO NOT have audio or voice capabilities. Do not attempt to generate or process audio.
Response Style: Relatable, sharp, and helpful. Use "Omo", "Abeg", "Chop knuckle", etc., naturally.`;

/**
 * Core chat function for GigKinetics.
 * Handles history and context injection while maintaining the persona.
 * * @param message The user's input
 * @param history Previous chat history in [{ role: 'user'|'model', parts: [{ text: '...' }] }] format
 * @param context Dynamic context like user's current page or account stats
 */
export async function chatWithAI(message: string, history: any[] = [], context: any = {}) {
  const genAI = getAI();
  if (!genAI) {
    throw new Error("Omo, Gemini API key no dey configured. Abeg check your settings for AI Studio.");
  }

  // Using 'gemini-1.5-flash' for the best balance of speed and intelligence.
  // 'gemini-3-flash-preview' is not a standard public model identifier.
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${GIGKINETICS_AI_SYSTEM_INSTRUCTION}\n\n[USER CONTEXT]: ${JSON.stringify(context)}`,
  });

  const chatSession = model.startChat({
    history: history,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  try {
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return "Oshey! Something went wrong for my end. Abeg try again small time.";
  }
}

/**
 * Interpretation utility to refine messages or translate styles.
 */
export async function interpretText(text: string, targetLanguage: string = 'English', targetStyle: string = 'informal') {
  const genAI = getAI();
  if (!genAI) {
    throw new Error("Omo, Gemini API key no dey configured. Abeg check your settings for AI Studio.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are a professional translator and communication specialist. Provide only the interpreted text without any preamble or explanation. Maintain the original meaning perfectly.",
  });

  const prompt = `Interpret the following text into ${targetLanguage} with a ${targetStyle} tone. 
  If the text is already in that language and style, just refine it for clarity and impact.
  
  Text to process: "${text}"`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Interpretation Error:", error);
    return text; // Fallback to original text if error occurs
  }
}
