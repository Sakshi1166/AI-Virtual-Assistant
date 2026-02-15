import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAssistant } from '../state/AssistantContext.jsx';

export default function AssistantAvatar() {
  const { settings, listening, speaking, awake } = useAssistant();
  const name = settings?.name || 'Jarvis';
  const avatarUrl = settings?.avatarUrl?.trim() || null;
  const [imgError, setImgError] = useState(false);
  const showAvatar = avatarUrl && !imgError;

  useEffect(() => setImgError(false), [avatarUrl]);

  const pulseVariants = {
    idle: { scale: 1, boxShadow: '0 0 0px rgba(56,189,248,0.0)' },
    listening: {
      scale: 1.06,
      boxShadow: '0 0 40px rgba(56,189,248,0.6)',
      transition: { duration: 0.8, yoyo: Infinity },
    },
    speaking: {
      scale: 1.03,
      boxShadow: '0 0 30px rgba(168,85,247,0.7)',
      transition: { duration: 0.6, yoyo: Infinity },
    },
  };

  const waveVariants = {
    idle: { scaleY: 0.2 },
    active: {
      scaleY: [0.3, 1.2, 0.4],
      transition: {
        repeat: Infinity,
        repeatType: 'mirror',
        duration: 0.9,
        ease: 'easeInOut',
      },
    },
  };

  const state = speaking ? 'speaking' : listening ? 'listening' : 'idle';

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative h-40 w-40 rounded-full bg-gradient-to-br from-jarvis-primary to-jarvis-accent flex items-center justify-center overflow-hidden"
        variants={pulseVariants}
        animate={state}
      >
        {showAvatar ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            onLoad={() => setImgError(false)}
          />
        ) : (
          <div className="text-4xl font-semibold text-slate-900">
            {name[0]?.toUpperCase() ?? 'J'}
          </div>
        )}

        {/* Waveform at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 pb-2">
          {Array.from({ length: 12 }).map((_, idx) => (
            <motion.span
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className="w-1 rounded-full bg-white/70"
              style={{ height: `${10 + idx * 2}%` }}
              variants={waveVariants}
              animate={state === 'idle' ? 'idle' : 'active'}
            />
          ))}
        </div>
      </motion.div>
      <div className="text-center">
        <div className="text-lg font-semibold">{name}</div>
        <div className="text-sm text-slate-400">
          {listening
            ? awake
              ? 'Listening...'
              : 'Say “Hey Jarvis” to wake'
            : 'Voice idle'}
        </div>
      </div>
    </div>
  );
}

