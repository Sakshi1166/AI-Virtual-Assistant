import React, { useState } from 'react';
import { useAssistant } from '../state/AssistantContext.jsx';

export default function ChatSidebar() {
  const {
    history,
    loadingHistory,
    loadChat,
    deleteChat,
    renameChat,
    refreshHistory,
    chatId,
  } = useAssistant();

  const [editingId, setEditingId] = useState(null);
  const [titleDraft, setTitleDraft] = useState('');

  const startRename = (chat) => {
    setEditingId(chat._id);
    setTitleDraft(chat.title || '');
  };

  const commitRename = async (id) => {
    await renameChat(id, titleDraft || 'Conversation');
    setEditingId(null);
    setTitleDraft('');
  };

  return (
    <aside className="w-72 bg-slate-950/60 border-r border-slate-800 flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="font-semibold text-sm">Conversations</div>
        <button
          type="button"
          onClick={refreshHistory}
          className="text-xs text-slate-400 hover:text-jarvis-primary"
        >
          Refresh
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 text-sm">
        {loadingHistory && (
          <div className="text-xs text-slate-500 px-2">Loading history...</div>
        )}
        {history.map((chat) => (
          <div
            key={chat._id}
            className={`group flex items-center gap-1 px-2 py-2 rounded-lg cursor-pointer ${
              chatId === chat._id ? 'bg-slate-800' : 'hover:bg-slate-900'
            }`}
          >
            <button
              type="button"
              onClick={() => loadChat(chat._id)}
              className="flex-1 text-left truncate"
            >
              {editingId === chat._id ? (
                <input
                  className="bg-slate-900 rounded px-1 text-xs w-full"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => commitRename(chat._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(chat._id);
                  }}
                  autoFocus
                />
              ) : (
                <span className="text-xs text-slate-200">
                  {chat.title || 'Conversation'}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => startRename(chat)}
              className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-jarvis-primary"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => deleteChat(chat._id)}
              className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
        {history.length === 0 && !loadingHistory && (
          <div className="text-xs text-slate-500 px-2 pt-2">
            No conversations yet. Start talking to Jarvis!
          </div>
        )}
      </div>
    </aside>
  );
}

