import React, { useState, useEffect } from 'react';
import { useAssistant } from '../state/AssistantContext.jsx';

export default function CustomizationPanel() {
  const { settings, updateSettings, voices } = useAssistant();
  const [form, setForm] = useState({
    name: 'Jarvis',
    personality: 'friendly',
    customPrompt: '',
    theme: 'dark',
    voiceName: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        name: settings.name || 'Jarvis',
        personality: settings.personality || 'friendly',
        customPrompt: settings.customPrompt || '',
        theme: settings.theme || 'dark',
        voiceName: settings.voiceName || '',
      }));
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateSettings(form);
    setSaving(false);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
      <div className="font-semibold text-sm mb-1">Customization</div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-slate-400">Assistant name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-400">Personality</label>
          <select
            name="personality"
            value={form.personality}
            onChange={handleChange}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="motivational">Motivational</option>
            <option value="sarcastic">Sarcastic</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {form.personality === 'custom' && (
          <div className="space-y-1">
            <label className="block text-slate-400">Custom system prompt</label>
            <textarea
              name="customPrompt"
              value={form.customPrompt}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-slate-400">Theme</label>
          <select
            name="theme"
            value={form.theme}
            onChange={handleChange}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-slate-400">Voice (if supported)</label>
          <select
            name="voiceName"
            value={form.voiceName}
            onChange={handleChange}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs"
          >
            <option value="">System default</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full mt-2 rounded-lg bg-jarvis-primary text-slate-950 font-medium py-1.5 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}

