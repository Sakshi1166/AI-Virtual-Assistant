import express from 'express';
import multer from 'multer';
import { authRequired } from '../middleware/auth.js';
import AssistantSettings from '../models/AssistantSettings.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Get current user's assistant settings
router.get('/', authRequired, async (req, res, next) => {
  try {
    const settings = await AssistantSettings.findOne({ user: req.user.id });
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// Update assistant settings (non-avatar)
router.put('/', authRequired, async (req, res, next) => {
  try {
    const {
      name,
      personality,
      customPrompt,
      theme,
      voiceName,
      onboardingCompleted,
    } = req.body;
    const update = {
      ...(name !== undefined ? { name } : {}),
      ...(personality !== undefined ? { personality } : {}),
      ...(customPrompt !== undefined ? { customPrompt } : {}),
      ...(theme !== undefined ? { theme } : {}),
      ...(voiceName !== undefined ? { voiceName } : {}),
      ...(onboardingCompleted !== undefined ? { onboardingCompleted } : {}),
    };
    const settings = await AssistantSettings.findOneAndUpdate(
      { user: req.user.id },
      update,
      { new: true, upsert: true },
    );
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// Upload avatar image
router.post('/avatar', authRequired, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Avatar file is required' });
    }

    const hasCloudinary =
      !!cloudinary.config().cloud_name &&
      !!cloudinary.config().api_key &&
      !!cloudinary.config().api_secret;

    let avatarUrl = '';

    if (hasCloudinary) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'ai-virtual-assistant/avatars',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            return resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });
      avatarUrl = uploadResult.secure_url;
    } else {
      const uploadsRoot = path.join(process.cwd(), 'uploads');
      const avatarsDir = path.join(uploadsRoot, 'avatars');
      fs.mkdirSync(avatarsDir, { recursive: true });
      const ext = (req.file.originalname || '').split('.').pop()?.toLowerCase() || 'png';
      const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'png';
      const filename = `${req.user.id}_${Date.now()}.${safeExt}`;
      const filePath = path.join(avatarsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      const baseUrl = process.env.SERVER_PUBLIC_URL || '';
      avatarUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/uploads/avatars/${filename}` : `/uploads/avatars/${filename}`;
    }

    const settings = await AssistantSettings.findOneAndUpdate(
      { user: req.user.id },
      { avatarUrl },
      { new: true, upsert: true },
    );
    res.json(settings);
  } catch (err) {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Avatar file too large. Maximum size is 5MB.' });
    }
    return next(err);
  }
});

export default router;

