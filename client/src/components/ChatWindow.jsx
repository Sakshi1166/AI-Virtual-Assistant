import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAssistant } from '../state/AssistantContext.jsx';

export default function ChatWindow() {
  const {
    messages,
    sending,
    sttSupported,
    sttError,
    ttsSupported,
    listening,
    startListening,
    stopListening,
    processCommand,
    assistantError,
  } = useAssistant();

  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // Memoize messages rendering to prevent flickering
  const messageList = useMemo(() => {
    return messages.map((m, idx) => (
      // eslint-disable-next-line react/no-array-index-key
      <div key={idx} className="flex">
        <div
          className={`max-w-[80%] rounded-2xl px-3 py-2 ${
            m.role === 'user'
              ? 'ml-auto bg-jarvis-primary text-slate-950'
              : 'mr-auto bg-slate-800 text-slate-50'
          }`}
        >
          <div className="whitespace-pre-wrap">{m.content}</div>
        </div>
      </div>
    ));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await processCommand(text);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800/80">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {sttError ? (
            <span className="text-red-400">
              {sttError === 'not-allowed' ? (
                'Microphone blocked'
              ) : sttError === 'network' ? (
                'Speech network error. Check connection or try again.'
              ) : (
                `Speech error: ${sttError}`
              )}
            </span>
          ) : sttSupported ? (
            'Voice ready · Say “Hey Jarvis”'
          ) : (
            'Voice not supported in this browser'
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {ttsSupported && <span>Auto voice reply</span>}
          {!sttSupported && (
            <span className="text-amber-400">Web Speech API unsupported</span>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm"
      >
        {assistantError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-xl text-center text-xs mb-4">
            {assistantError}
          </div>
        )}
        {messages.length === 0 && (
          <div className="text-slate-500 text-center mt-10">
            Start speaking after saying “Hey Jarvis”, or type below.
          </div>
        )}
        {messageList}
        {sending && (
          <div className="flex">
            <div className="mr-auto rounded-2xl px-3 py-2 bg-slate-800 text-slate-400 text-sm">
              Jarvis is thinking...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-800 px-4 py-3 flex items-center gap-2"
      >
        <input
          type="text"
          className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-jarvis-primary"
          placeholder="Type anything for Jarvis..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-xl bg-jarvis-primary text-slate-950 text-sm font-medium disabled:opacity-60"
          disabled={!input.trim() || sending}
        >
          Send
        </button>
        {sttSupported && (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            className={`w-9 h-9 rounded-full border text-xs ${
              listening
                ? 'border-red-400 text-red-300 bg-red-500/10'
                : 'border-jarvis-primary text-jarvis-primary'
            }`}
          >
            {listening ? 'Stop' : 'Mic'}
          </button>
        )}
      </form>
    </div>
  );
}

