import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { useAssistant } from '../state/AssistantContext.jsx';
import ChatSidebar from '../components/ChatSidebar.jsx';
import AssistantAvatar from '../components/AssistantAvatar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import CustomizationPanel from '../components/CustomizationPanel.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { theme, settings } = useAssistant();
  const navigate = useNavigate();

  useEffect(() => {
    if (settings && !settings.onboardingCompleted && !settings.avatarUrl) {
      navigate('/onboarding', { replace: true });
    }
  }, [settings, navigate]);

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-slate-100 text-slate-900'
      } flex`}
    >
      <ChatSidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-800/80 flex items-center justify-between px-6">
          <div>
            <div className="text-sm font-semibold">Jarvis Control Center</div>
            <div className="text-xs text-slate-400">
              Welcome back, {user?.name || 'Commander'}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-slate-400 hover:text-red-400 border border-slate-700 rounded-lg px-3 py-1.5"
          >
            Logout
          </button>
        </header>

        <div className="flex-1 grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1.2fr)] gap-4 px-4 py-4">
          <div className="flex items-center justify-center">
            <AssistantAvatar />
          </div>
          <div className="h-full">
            <ChatWindow />
          </div>
          <div>
            <CustomizationPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

