import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ChatPanel from './components/ChatPanel';
import ToastHost from './components/ToastHost';
import Orb3D from './components/Orb3D';
import KloudeMark from './components/KloudeMark';
import { pingRuntime } from './lib/runtimeApi';
import { useChat } from './hooks/useAgent';
import { useStore } from './store/useStore';

const SESSIONS_KEY = 'kloude:sessions';

function makeId() {
  const id = globalThis.crypto?.randomUUID?.();
  if (id) return id;
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadSessionsIndex() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessionsIndex(items) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function loadSessionData(id) {
  try {
    const raw = localStorage.getItem(`kloude:session:${id}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSessionData(id, data) {
  try {
    localStorage.setItem(`kloude:session:${id}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function App() {
  const [sessions, setSessions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenuSessionId, setActiveMenuSessionId] = useState(null);
  const [renamingSessionId, setRenamingSessionId] = useState(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  const setBackendStatus = useStore((state) => state.setBackendStatus);
  const resetSession = useStore((state) => state.resetSession);
  const loadSessionState = useStore((state) => state.loadSessionState);
  const currentSessionId = useStore((state) => state.currentSessionId);
  const setCurrentSessionId = useStore((state) => state.setCurrentSessionId);
  const messages = useStore((state) => state.messages);

  const { sendMessage } = useChat();

  useEffect(() => {
    setSessions(loadSessionsIndex());
  }, []);

  // Autosave
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      saveSessionData(currentSessionId, { id: currentSessionId, messages });
      const cached = loadSessionsIndex();
      const idx = cached.findIndex((s) => s.id === currentSessionId);
      if (idx !== -1) {
        cached[idx].updatedAt = Date.now();
        saveSessionsIndex(cached);
      }
    }
  }, [currentSessionId, messages]);

  // Ping backend
  useEffect(() => {
    let mounted = true;
    async function pingBackend() {
      try {
        const result = await pingRuntime();
        if (mounted) setBackendStatus(result?.ok ? 'connected' : 'error');
      } catch {
        if (mounted) setBackendStatus('error');
      }
    }
    pingBackend();
    return () => { mounted = false; };
  }, [setBackendStatus]);

  // Click outside to close menu
  useEffect(() => {
    if (!activeMenuSessionId) return;
    const handler = (e) => {
      if (!e.target.closest('.kloude-session-menu') && !e.target.closest('.kloude-session-menu-trigger')) {
        setActiveMenuSessionId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeMenuSessionId]);

  const handleSendMessage = (prompt) => {
    if (!currentSessionId) {
      const newId = makeId();
      const title = prompt.length > 50 ? prompt.slice(0, 48) + '...' : prompt;
      const newSessionMeta = { id: newId, title, updatedAt: Date.now(), pinned: false };
      const nextSessions = [newSessionMeta, ...sessions].slice(0, 30);
      setSessions(nextSessions);
      saveSessionsIndex(nextSessions);
      setCurrentSessionId(newId);
    }
    return sendMessage(prompt);
  };

  const handleNewChat = () => { setActiveMenuSessionId(null); resetSession(); };

  const handleSessionClick = (item) => {
    if (activeMenuSessionId) {
      setActiveMenuSessionId(null);
      return;
    }
    if (!item?.id) return;
    const oldSession = loadSessionData(item.id);
    if (oldSession) {
      loadSessionState(oldSession);
    } else {
      resetSession();
      setCurrentSessionId(item.id);
    }
    const filtered = sessions.filter((s) => s.id !== item.id);
    const nextSessions = [{ ...item, updatedAt: Date.now() }, ...filtered];
    setSessions(nextSessions);
    saveSessionsIndex(nextSessions);
  };

  const handleTogglePin = (id) => {
    const next = sessions.map((s) => s.id === id ? { ...s, pinned: !s.pinned } : s);
    setSessions(next);
    saveSessionsIndex(next);
    setActiveMenuSessionId(null);
  };

  const handleDeleteSession = (id) => {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    saveSessionsIndex(next);
    localStorage.removeItem(`kloude:session:${id}`);
    if (currentSessionId === id) resetSession();
    setActiveMenuSessionId(null);
  };

  const handleStartRename = (item) => {
    setRenamingSessionId(item.id);
    setRenamingTitle(item.title);
    setActiveMenuSessionId(null);
  };

  const handleFinishRename = (id) => {
    const next = sessions.map((s) => s.id === id ? { ...s, title: renamingTitle || s.title } : s);
    setSessions(next);
    saveSessionsIndex(next);
    setRenamingSessionId(null);
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="kloude-app">
      {/* Animated Orb Background */}
      <Orb3D className="kloude-orb-bg" />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`kloude-sidebar ${sidebarOpen ? '' : 'collapsed'}`}
      >
        <div className="kloude-sidebar-top">
          <button
            className="kloude-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            type="button"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="kloude-new-chat-btn"
            onClick={handleNewChat}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            {sidebarOpen && <span>New Chat</span>}
          </motion.button>
        </div>

        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="kloude-sidebar-sessions"
          >
            {sortedSessions.length === 0 ? (
              <span className="kloude-sidebar-empty">No conversations yet</span>
            ) : (
              sortedSessions.map((item) => (
                <div key={item.id} className="kloude-session-row">
                  {renamingSessionId === item.id ? (
                    <div className="kloude-session-rename-box">
                      <input
                        autoFocus
                        className="kloude-rename-input"
                        value={renamingTitle}
                        onChange={(e) => setRenamingTitle(e.target.value)}
                        onBlur={() => handleFinishRename(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishRename(item.id);
                          if (e.key === 'Escape') setRenamingSessionId(null);
                        }}
                      />
                    </div>
                  ) : (
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ backgroundColor: 'rgba(66, 188, 244, 0.08)' }}
                      className={`kloude-session-btn ${item.id === currentSessionId ? 'active' : ''} ${item.pinned ? 'pinned' : ''}`}
                      onClick={() => handleSessionClick(item)}
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="kloude-session-icon">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span className="kloude-session-title">{item.title}</span>
                      {item.pinned && (
                        <svg className="kloude-pin-indicator" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 9V4l1 0V2H7v2h1v5L6 12v2h5v7l1 1 1-1v-7h5v-2l-2-3z" />
                        </svg>
                      )}
                      
                      <button
                        className="kloude-session-menu-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuSessionId(activeMenuSessionId === item.id ? null : item.id);
                        }}
                        type="button"
                        aria-label="Session options"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                    </motion.button>
                  )}

                  {activeMenuSessionId === item.id && (
                    <div className="kloude-session-menu">
                      <button onClick={() => handleTogglePin(item.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 9V4l1 0V2H7v2h1v5L6 12v2h5v7l1 1 1-1v-7h5v-2l-2-3z" /></svg>
                        {item.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button onClick={() => handleStartRename(item)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Rename
                      </button>
                      <button className="delete-opt" onClick={() => handleDeleteSession(item.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>

        )}

        <div className="kloude-sidebar-bottom">
          {sidebarOpen && (
            <div className="kloude-sidebar-brand">
              <KloudeMark size={22} />
              <span>Kloude</span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="kloude-main"
      >
        <ChatPanel onSendMessage={handleSendMessage} />
      </motion.main>

      <ToastHost />
    </div>
  );
}

export default App;
