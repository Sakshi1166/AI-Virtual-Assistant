import express from 'express';
import Chat from '../models/Chat.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// List chats with pagination
router.get('/', authRequired, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Chat.find({ user: req.user.id })
        .select('title createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Chat.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// Get single chat with messages
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json(chat);
  } catch (err) {
    next(err);
  }
});

// Rename chat
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    const { title } = req.body;
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title },
      { new: true },
    ).select('title updatedAt');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json(chat);
  } catch (err) {
    next(err);
  }
});

// Delete chat
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const deleted = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

