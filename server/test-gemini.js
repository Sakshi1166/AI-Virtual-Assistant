import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('--- Gemini Connection Test ---');
  console.log('Testing with model:', process.env.GEMINI_MODEL || 'gemini-1.5-flash');

  try {
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const result = await model.generateContent('Say "connection successful"');
    const response = await result.response;
    console.log('Result:', response.text());
    console.log('Connection: SUCCESS');
  } catch (err) {
    console.error('Connection: FAILED');
    console.error('Error Message:', err.message);
    
    console.log('\nAttempting to list available models...');
    try {
      // Use a manual fetch to list models since the SDK doesn't always expose it easily
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      if (data.models) {
        console.log('Available Models:');
        data.models.forEach(m => console.log(' -', m.name));
      } else {
        console.log('Could not list models:', JSON.stringify(data, null, 2));
      }
    } catch (listErr) {
      console.error('Failed to list models:', listErr.message);
    }
  }
}

testGemini();
