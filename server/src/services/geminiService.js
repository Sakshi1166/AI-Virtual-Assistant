import { GoogleGenerativeAI } from '@google/generative-ai';

const getClient = () => {
  const API_KEY = process.env.GEMINI_API_KEY || '';
  if (!API_KEY) return null;
  return new GoogleGenerativeAI(API_KEY);
};

const PERSONALITY_PROMPTS = {
  professional: 'You are a highly professional AI assistant. Respond concisely, clearly, and formally.',
  friendly: 'You are a friendly and warm AI assistant. Use casual, approachable language.',
  motivational: 'You are a motivational coach. Encourage and inspire the user while answering.',
  sarcastic: 'You are a witty, mildly sarcastic assistant. Be playful but never rude or offensive.',
};

export async function generateAssistantReply({
  personality = 'friendly',
  customPrompt = '',
  messages = [],
}) {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const basePrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.friendly;
  const systemPrompt = personality === 'custom'
    ? (customPrompt || 'You are a customizable AI assistant.')
    : basePrompt;

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = client.getGenerativeModel({ model: modelName });

  const historyText = messages
    .slice(-10) // Only send last 10 messages to avoid token limits
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = `${systemPrompt}

Context of the conversation:
${historyText}

Instructions: Respond to the last message as the AI Assistant. Keep it conversational.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (err) {
    console.error('--- GEMINI API ERROR DETAIL ---');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    if (err.stack) {
      console.error('Stack Trace:', err.stack);
    }
    console.error('-------------------------------');
    throw new Error(`AI processing failed: ${err.message}`);
  }
}

