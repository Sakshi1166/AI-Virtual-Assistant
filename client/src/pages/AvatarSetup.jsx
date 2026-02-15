import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistant } from '../state/AssistantContext.jsx';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function AvatarSetup() {
  const { settings, uploadAvatar, updateSettings } = useAssistant();
  const navigate = useNavigate();
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settings?.avatarUrl) {
      setPreview(settings.avatarUrl);
    }
  }, [settings?.avatarUrl]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const isImage = file.type.startsWith('image/') || ACCEPTED_TYPES.includes(file.type);
    if (!isImage) {
      setError(`Please select an image (JPEG, PNG, GIF, or WebP).`);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreview(dataUrl);

      const avatarUrl = await uploadAvatar(file);
      if (avatarUrl) {
        setPreview(avatarUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload. Please try another image.');
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = async () => {
    try {
      await updateSettings({ onboardingCompleted: true });
    } finally {
      navigate('/', { replace: true });
    }
  };

  const handleSkip = async () => {
    try {
      await updateSettings({ onboardingCompleted: true });
    } finally {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-xl text-sm">
        <h1 className="text-xl font-semibold text-slate-50 mb-1">Set your avatar</h1>
        <p className="text-slate-400 mb-6">
          Personalize your Jarvis with a profile image. Max {MAX_SIZE_MB}MB, any ratio.
        </p>

        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="h-28 w-28 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border-2 border-slate-700 shrink-0">
            {preview ? (
              <img
                key={preview.slice(0, 50)}
                src={preview}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-slate-400 text-3xl">😊</div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-jarvis-primary text-slate-950 font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Choose image'}
          </button>
          <p className="text-xs text-slate-500">JPEG, PNG, GIF, or WebP • Max {MAX_SIZE_MB}MB</p>
          {error && <div className="text-xs text-red-400">{error}</div>}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleContinue}
            disabled={uploading}
            className="flex-1 rounded-lg bg-jarvis-primary text-slate-950 font-medium py-2 disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Continue'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg border border-slate-700 text-slate-200 px-4 py-2"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
