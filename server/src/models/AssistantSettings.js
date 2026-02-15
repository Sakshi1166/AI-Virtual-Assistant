import mongoose from 'mongoose';

const assistantSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true,
  },
  name: {
    type: String,
    default: 'Jarvis',
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  personality: {
    type: String,
    enum: ['professional', 'friendly', 'motivational', 'sarcastic', 'custom'],
    default: 'friendly',
  },
  customPrompt: {
    type: String,
    default: '',
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'dark',
  },
  voiceName: {
    type: String,
    default: '',
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model('AssistantSettings', assistantSettingsSchema);

