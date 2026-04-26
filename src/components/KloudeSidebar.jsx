import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function KloudeSidebar({ onNewChat, onRecentClick, sessions = [], activeSessionId }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');

  const pushToast = useStore((s) => s.pushToast);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!showSearch) return undefined;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [showSearch]);

  const filteredRecents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return sessions;
    return sessions.filter((item) => String(item?.title || '').toLowerCase().includes(needle));
  }, [sessions, search]);

  return (
    <aside className={`gemini-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="gemini-sidebar-top">
        <div className="gemini-sidebar-actions">
          <button
            className="gemini-icon-btn menu-btn"
            type="button"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((v) => !v)}
          >
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>

          {!sidebarCollapsed && (
            <button
              className="gemini-icon-btn search-btn"
              type="button"
              aria-label="Search recent"
              onClick={() => setShowSearch((v) => !v)}
            >
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </button>
          )}
        </div>

        {!sidebarCollapsed && showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="voltee-sidebar-search"
          >
            <input
              ref={searchInputRef}
              className="voltee-sidebar-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search simulations..."
            />
          </motion.div>
        )}

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="gemini-new-chat-btn" 
          type="button" 
          onClick={onNewChat}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New Simulation
        </motion.button>

        {!sidebarCollapsed && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="sidebar-expanded-content"
            >
              <div className="gemini-sidebar-section flex-1">
                <div className="gemini-section-header chats-header">Recent Architectures</div>
                <div className="gemini-history-list">
                  {filteredRecents.length === 0 ? (
                    <span className="voltee-muted">No recent simulations.</span>
                  ) : (
                    filteredRecents.map((item) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ backgroundColor: "rgba(66, 188, 244, 0.1)" }}
                        type="button"
                        className={`voltee-history-btn ${item.id === activeSessionId ? 'active' : ''}`}
                        onClick={() => onRecentClick?.(item)}
                      >
                        <span className="voltee-history-text">{item.title}</span>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {!sidebarCollapsed && (
        <div className="gemini-sidebar-bottom">
          <button
            className="gemini-sidebar-item settings-item"
            type="button"
            onClick={() => pushToast('Settings are coming soon.', 'info')}
          >
            <svg className="gemini-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
            <div className="gemini-update-dot" />
          </button>
        </div>
      )}
    </aside>
  );
}
