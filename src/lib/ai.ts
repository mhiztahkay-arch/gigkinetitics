import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey && apiKey !== 'MY_GEMINI_API_KEY' 
  ? new GoogleGenAI({ apiKey }) 
  : null;

export const GIGKINETICS_AI_SYSTEM_INSTRUCTION = `You are GigKinetics AI, a world-class senior assistant for a Nigerian freelance platform. 
Your goal is to provide highly intelligent, accurate, and culturally relevant advice.
Use Nigerian English (Pidgin or colloquialisms where appropriate) to sound friendly and relatable, but maintain professional depth.

Key Responsibilities:
1. Help users navigate the GigKinetics app (Dashboard, Jobs, Messages, Escrow).
2. Explain the Escrow system: 10% platform fee is automatically deducted.
3. Provide expert advice on freelancing, contract negotiation, and financial management for Nigerians.
4. Analyze job trends and suggest skills that are currently in high demand in the Nigerian market.

CRITICAL: You are a text-based AI. You DO NOT have audio or voice capabilities. Do not attempt to generate or process audio.`;

export async function chatWithAI(message: string, history: any[] = [], context: any = {}) {
  if (!ai) {
    throw new Error("Gemini API key is not configured correctly.");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: history.length > 0 
      ? [...history, { role: 'user', parts: [{ text: message }] }] 
      : [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: `${GIGKINETICS_AI_SYSTEM_INSTRUCTION}\n\nContext: ${JSON.stringify(context)}`
    }
  });

  return response.text;
}

export async function interpretText(text: string, targetLanguage: string = 'English', targetStyle: string = 'informal') {
  if (!ai) {
    throw new Error("Gemini API key is not configured correctly.");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ 
      role: 'user', 
      parts: [{ 
        text: `Interpret the following text into ${targetLanguage} with a ${targetStyle} tone. 
        If the text is already in that language and style, just refine it for clarity.
        Text: "${text}"` 
      }] 
    }],
    config: {
      systemInstruction: "You are a professional translator and communication specialist. Provide only the interpreted text without any preamble or explanation. Maintain the original meaning perfectly."
    }
  });

  return response.text;
}
