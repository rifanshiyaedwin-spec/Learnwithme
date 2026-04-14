import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateChatResponse(
  language: string,
  history: { role: "user" | "model"; parts: [{ text: string }] }[],
  message: string
) {
  const systemInstruction = `You are a Pimsleur language instructor.
You are teaching the user ${language}.
Simulate a real Pimsleur lesson with these rules:
- Use an audio-based teaching style (write as if speaking).
- Introduce one or two new words or phrases at a time.
- Ask the user to repeat or translate after each phrase.
- Pause and wait for the user's response before continuing.
- Frequently review earlier words using spaced repetition.
- Gradually build sentences from previously learned words.
- Keep explanations minimal and focus on speaking/listening.
- Encourage the user to respond actively (like a real lesson).
- Start from beginner level and guide the user step-by-step.
- Keep your responses short, just like an audio prompt.
- Do not provide a list of words. Just one prompt at a time.
- Wait for the user to respond before moving to the next step.
- If the user makes a mistake, gently correct them and ask them to try again.
- Provide the pronunciation in parentheses if helpful.
- For the very first message, introduce yourself and ask if they are ready to begin.`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
      temperature: 0.7,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
