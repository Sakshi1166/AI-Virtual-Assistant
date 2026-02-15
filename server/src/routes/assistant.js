import express from 'express';
import rateLimit from 'express-rate-limit';
import { authRequired } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import AssistantSettings from '../models/AssistantSettings.js';
import { generateAssistantReply } from '../services/geminiService.js';
import { getWeatherForCity, extractCityFromWeatherQuery } from '../services/weatherService.js';

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

// Send a message to the assistant (creates or continues a chat)
router.post('/message', authRequired, aiLimiter, async (req, res, next) => {
  try {
    const { chatId, content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: req.user.id });
    }
    if (!chat) {
      chat = await Chat.create({
        user: req.user.id,
        title: content.slice(0, 60) || 'New conversation',
        messages: [],
      });
    }

    const userMessage = { role: 'user', content, createdAt: new Date() };
    chat.messages.push(userMessage);

    let responseText;

    // Check for weather intent - use real API for accurate data
    const city = extractCityFromWeatherQuery(content);
    if (city) {
      try {
        const weather = await getWeatherForCity(city);
        responseText = `In ${weather.city}, it's currently ${weather.temp}°C (feels like ${weather.feelsLike}°C) with ${weather.description}. Humidity: ${weather.humidity}%.`;
      } catch (weatherErr) {
        responseText = `I couldn't fetch the weather for ${city}. ${weatherErr.message}`;
      }
    } else {
      const settings = await AssistantSettings.findOne({ user: req.user.id }) || {};
      responseText = await generateAssistantReply({
        personality: settings.personality || 'friendly',
        customPrompt: settings.customPrompt || '',
        messages: chat.messages,
      });
    }

    const assistantMessage = {
      role: 'assistant',
      content: responseText,
      createdAt: new Date(),
    };
    chat.messages.push(assistantMessage);
    await chat.save();

    res.json({
      chatId: chat._id,
      messages: [userMessage, assistantMessage],
    });
  } catch (err) {
    next(err);
  }
});

export default router;

