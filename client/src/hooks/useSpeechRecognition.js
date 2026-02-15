import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Enhanced Speech Recognition Hook.
 * FIX: Uses Refs for state management to avoid stale closures in event handlers.
 * FIX: Implements "Silent Retry" for network errors to prevent UI flickering.
 * Optimized for en-IN and hi-IN.
 */
export function useSpeechRecognition({ 
  onResult, 
  onEnd, 
  lang = 'en-IN', 
  interimResults = true 
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs to track state without closure issues
  const recognitionRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const manualStopRef = useRef(false);
  const lastErrorRef = useRef(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
    }
  }, []);

  const createRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false; // Stay in non-continuous for stability
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onstart = () => {
      setListening(true);
      isListeningRef.current = true;
      setError(null);
      lastErrorRef.current = null;
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      if (onResult) {
        onResult(transcript, event.results[event.results.length - 1].isFinal);
      }
    };

    recognition.onerror = (event) => {
      const errType = event.error;
      lastErrorRef.current = errType;
      
      console.warn(`[SpeechRecognition] Error: ${errType}`);

      if (errType === 'no-speech' || errType === 'aborted') return;

      if (errType === 'network') {
        // We don't set the visible error state immediately for network errors
        // to keep the experience "silent" during retries.
        console.log('[SpeechRecognition] Silent retry for network error...');
      } else if (errType === 'not-allowed') {
        setError('not-allowed');
        manualStopRef.current = true;
      } else {
        setError(errType);
      }
    };

    recognition.onend = () => {
      setListening(false);
      isListeningRef.current = false;
      
      if (!manualStopRef.current) {
        // Determine delay based on last error
        // If it was a network error, wait longer (3s), otherwise restart fast (200ms)
        const delay = lastErrorRef.current === 'network' ? 3000 : 200;
        
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          if (!manualStopRef.current && !isListeningRef.current) {
            try {
              recognitionRef.current = createRecognition();
              recognitionRef.current.start();
            } catch (e) {
              console.error('[SpeechRecognition] Restart failed', e);
            }
          }
        }, delay);
      }

      if (onEnd) onEnd();
    };

    return recognition;
  }, [lang, interimResults, onResult, onEnd]);

  const start = useCallback(() => {
    manualStopRef.current = false;
    lastErrorRef.current = null;
    setError(null);
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const recognition = createRecognition();
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error('[SpeechRecognition] Initial start failed', e);
    }
  }, [createRecognition]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    setListening(false);
    isListeningRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  return { supported, listening, error, start, stop };
}
