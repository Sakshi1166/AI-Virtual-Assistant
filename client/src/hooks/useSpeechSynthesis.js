import { useCallback, useEffect, useState } from 'react';

export function useSpeechSynthesis(preferredVoiceName) {
  const [supported, setSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;

    const populateVoices = () => {
      const list = synth.getVoices();
      // Filter for Indian English (en-IN) and Hindi (hi-IN)
      const filtered = list.filter((v) => 
        v.lang.startsWith('en-IN') || 
        v.lang.startsWith('hi-IN') || 
        v.lang.includes('India')
      );
      setVoices(filtered.length > 0 ? filtered : list); // Fallback to all if none found
    };

    populateVoices();
    synth.onvoiceschanged = populateVoices;
  }, [supported]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return;
      const synth = window.speechSynthesis;
      if (synth.speaking) synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (preferredVoiceName && voices.length) {
        const match = voices.find((v) => v.name === preferredVoiceName);
        if (match) {
          utterance.voice = match;
        }
      }
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synth.speak(utterance);
    },
    [supported, voices, preferredVoiceName],
  );

  const cancel = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return {
    supported,
    speaking,
    voices,
    speak,
    cancel,
  };
}

