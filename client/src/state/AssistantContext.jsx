import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../api/client.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';
import { useAuth } from './AuthContext.jsx';

const AssistantContext = createContext(null);

const WAKE_WORD = 'hey jarvis';

function detectIntent(text) {
  const lower = text.toLowerCase();

  if (lower.includes('search google for') || lower.startsWith('google ')) {
    return 'search_intent';
  }
  if (lower.includes('youtube') || lower.startsWith('play ') || lower.includes('on youtube')) {
    return 'youtube_intent';
  }
  if (lower.includes('time') || lower.includes('date')) {
    return 'time_intent';
  }
  return 'general_ai_intent';
}

function buildUrlForIntent(intent, text) {
  const query = encodeURIComponent(text);
  if (intent === 'search_intent') {
    // Strip leading command
    const cleaned = text.toLowerCase().replace('search google for', '').trim();
    return `https://www.google.com/search?q=${encodeURIComponent(cleaned || text)}`;
  }
  if (intent === 'youtube_intent') {
    const cleaned = text.toLowerCase().replace('on youtube', '').trim();
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(cleaned || text)}`;
  }
  return null;
}

export function AssistantProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const [awake, setAwake] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');

  const handleSpeechResult = useCallback((text, isFinal) => {
    setRawTranscript(text);
    if (isFinal) {
      // Logic for auto-processing if awake
      console.log('[Assistant] Final speech result:', text);
    }
  }, []);

  const {
    supported: sttSupported,
    listening,
    error: sttError,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({
    lang: settings?.language === 'Hindi' ? 'hi-IN' : 'en-IN',
    onResult: handleSpeechResult,
  });

  const {
    supported: ttsSupported,
    speaking,
    voices,
    speak,
  } = useSpeechSynthesis(settings?.voiceName);

  // Theme handling
  useEffect(() => {
    const effective = settings?.theme || 'dark';
    setTheme(effective);
    const root = document.documentElement;
    if (effective === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);

  // Load settings and chat history for user
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [settingsRes, chatsRes] = await Promise.all([
          api.get('/settings'),
          api.get('/chats?limit=50'),
        ]);
        setSettings(settingsRes.data);
        setHistory(chatsRes.data.items || []);
      } catch (err) {
        console.error('Failed to load settings or history', err);
      }
    })();
  }, [user]);

  const updateSettings = async (partial) => {
    const res = await api.put('/settings', { ...settings, ...partial });
    setSettings(res.data);
  };

  const uploadAvatar = async (file) => {
    const form = new FormData();
    form.append('avatar', file);
    const res = await api.post('/settings/avatar', form);
    setSettings(res.data);
    return res.data?.avatarUrl || null;
  };

  const refreshHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/chats?limit=50');
      setHistory(res.data.items || []);
    } catch (err) {
      console.error('Failed to refresh history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadChat = async (id) => {
    try {
      const res = await api.get(`/chats/${id}`);
      setChatId(res.data._id);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load chat', err);
    }
  };

  const renameChat = async (id, title) => {
    try {
      await api.patch(`/chats/${id}`, { title });
      await refreshHistory();
    } catch (err) {
      console.error('Failed to rename chat', err);
    }
  };

  const deleteChat = async (id) => {
    try {
      await api.delete(`/chats/${id}`);
      if (chatId === id) {
        setChatId(null);
        setMessages([]);
      }
      await refreshHistory();
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  const appendMessages = useCallback((newMessages) => {
    setMessages((prev) => [...prev, ...newMessages]);
  }, []);

  const sendToAssistant = async (content) => {
    setSending(true);
    setError(null);
    appendMessages([{ role: 'user', content, createdAt: new Date().toISOString() }]);
    try {
      const res = await api.post('/assistant/message', { chatId, content });
      setChatId(res.data.chatId);
      const assistantReply = res.data.messages.find((m) => m.role === 'assistant');
      if (assistantReply) {
        appendMessages([assistantReply]);
        if (ttsSupported) speak(assistantReply.content);
      }
    } catch (err) {
      console.error('Assistant error', err);
      setError(err.response?.data?.message || 'Failed to get a response from Jarvis. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Wake word + intent processing
  useEffect(() => {
    if (!sttSupported || !rawTranscript) return;

    const text = rawTranscript.toLowerCase();

    // Commands to sleep / stop
    if (text.includes('go to sleep') || text.includes('stop listening')) {
      setAwake(false);
      return;
    }

    // Detect wake word
    if (!awake && text.includes(WAKE_WORD)) {
      setAwake(true);
      if (ttsSupported) {
        speak(`Hello ${user?.name || ''}, how can I help you?`);
      }
      return;
    }

    if (!awake) return;

    // Once awake, treat the whole transcript after wake word as command
    // Simple approach: on pause in speech, you would normally send command.
    // Here we interpret the current transcript when it ends (SpeechRecognition onend would fire).
  }, [awake, rawTranscript, sttSupported, ttsSupported, speak, user]);

  // Manual trigger for processing a text command (e.g. from UI or finalized STT)
  const processCommand = useCallback(
    async (text) => {
      if (!text) return;

      const intent = detectIntent(text);
      if (intent === 'search_intent' || intent === 'youtube_intent') {
        const url = buildUrlForIntent(intent, text);
        if (url) {
          window.open(url, '_blank', 'noreferrer');
        }
        // Also respond verbally
        if (ttsSupported) {
          speak('Opening it now.');
        }
        return;
      }

      if (intent === 'time_intent') {
        const now = new Date();
        const response = `It is ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}.`;
        const msg = { role: 'assistant', content: response, createdAt: new Date().toISOString() };
        appendMessages([msg]);
        if (ttsSupported) speak(response);
        return;
      }

      // Default: send to AI backend
      await sendToAssistant(text);
    },
    [ttsSupported, speak, sendToAssistant],
  );

  const value = useMemo(
    () => ({
      settings,
      theme,
      updateSettings,
      uploadAvatar,
      voices,
      sttSupported,
      sttError,
      ttsSupported,
      listening,
      speaking,
      startListening,
      stopListening,
      awake,
      rawTranscript,
      messages,
      chatId,
      history,
      loadingHistory,
      refreshHistory,
      loadChat,
      renameChat,
      deleteChat,
      sending,
      sendToAssistant,
      assistantError: error,
      processCommand,
    }),
    [
      settings,
      theme,
      voices,
      sttSupported,
      sttError,
      ttsSupported,
      listening,
      speaking,
      startListening,
      stopListening,
      awake,
      rawTranscript,
      messages,
      chatId,
      history,
      loadingHistory,
      refreshHistory,
      loadChat,
      renameChat,
      deleteChat,
      sending,
      sendToAssistant,
      error,
      processCommand,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}

