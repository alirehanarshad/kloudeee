import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatPanel from './ChatPanel';
import Canvas from './Canvas';
import LibraryPanel from './LibraryPanel';
import TopMenu from './TopMenu';
import FloatingToolbar from './FloatingToolbar';
import PropertiesModal from './PropertiesModal';
import { useAgent } from '../hooks/useAgent';
import { useStore } from '../store/useStore';
import KloudeMark from './KloudeMark';
import Orb3D from './Orb3D';
import { Settings, Maximize2 } from 'lucide-react';

export default function Workspace({ onNewChat }) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  
  const { sendPrompt } = useAgent();
  const messages = useStore((state) => state.messages);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const selectedProvider = useStore((state) => state.selectedProvider);
  const setSelectedProvider = useStore((state) => state.setSelectedProvider);

  const lastUserPrompt = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const activeProject = String(lastUserPrompt || '').trim() ? String(lastUserPrompt).trim().slice(0, 28) : 'New Architecture';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="workspace-content"
    >
      <Orb3D className="voltee-workspace-orb" />

      {/* Main Container */}
      <div className="workspace-main">
        {/* Left pane: Chat */}
        <motion.div 
          animate={{ width: chatCollapsed ? 60 : 380 }}
          className={`workspace-chat-container ${chatCollapsed ? 'collapsed' : ''}`}
        >
           {/* Header with Title and User Profile */}
           <header className="workspace-chat-header">
              <div className="voltee-workspace-brand">
                <KloudeMark size={20} />
                <span>Kloude</span>
              </div>
              <div className="workspace-chat-header-actions">
                 <button className="gemini-chip badge-chip" type="button" title="Active simulation">
                    {activeProject}
                 </button>
              </div>
           </header>
           
           <div className="workspace-chat-panel-wrapper">
              <ChatPanel onSendMessage={sendPrompt} />
            </div>
         </motion.div>

        {/* Right pane: Canvas */}
        <div className="workspace-canvas-container">
          <div className="canvas-window">
             {/* Window Header */}
             <div className="canvas-window-header">
                <div className="canvas-window-nav-group">
                  <div className="canvas-window-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span>Lab</span>
                  </div>
                  <div className="header-divider" />
                  <TopMenu />
                </div>

                <div className="header-provider-logos">
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ 
                       opacity: 1, 
                       scale: selectedProvider === 'aws' ? 1.25 : 1
                     }}
                     transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                     className={`provider-logo-container ${selectedProvider === 'aws' ? 'active aws' : ''}`}
                     onClick={() => setSelectedProvider('aws')}
                     style={{ cursor: 'pointer' }}
                   >
                     <motion.img 
                        whileHover={{ rotateY: 20, rotateX: -10, scale: 1.2, z: 50 }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                        src="/AWS-logo.png" 
                        alt="AWS" 
                        className="provider-logo"
                      />
                   </motion.div>
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ 
                       opacity: 1, 
                       scale: selectedProvider === 'azure' ? 1.25 : 1
                     }}
                     transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                     className={`provider-logo-container ${selectedProvider === 'azure' ? 'active azure' : ''}`}
                     onClick={() => setSelectedProvider('azure')}
                     style={{ cursor: 'pointer' }}
                   >
                     <motion.img 
                        whileHover={{ rotateY: 20, rotateX: -10, scale: 1.2, z: 50 }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }}
                        src="/Azure-Logo.png" 
                        alt="Azure" 
                        className="provider-logo"
                      />
                   </motion.div>
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ 
                       opacity: 1, 
                       scale: selectedProvider === 'gcp' ? 1.25 : 1
                     }}
                     transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                     className={`provider-logo-container ${selectedProvider === 'gcp' ? 'active gcp' : ''}`}
                     onClick={() => setSelectedProvider('gcp')}
                     style={{ cursor: 'pointer' }}
                   >
                     <motion.img 
                        whileHover={{ rotateY: 20, rotateX: -10, scale: 1.2, z: 50 }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
                        src="/GCP-logo.png" 
                        alt="GCP" 
                        className="provider-logo"
                      />
                   </motion.div>
                </div>
                
                <div className="canvas-window-actions">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`gemini-icon-btn small-btn ${showLibrary ? 'active' : ''}`}
                    onClick={() => setShowLibrary(!showLibrary)}
                    title="Cloud Components"
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="gemini-icon-btn small-btn"
                    onClick={() => setChatCollapsed(!chatCollapsed)}
                    title="Toggle Chat"
                    type="button"
                  >
                    <Maximize2 size={16} />
                  </motion.button>
                </div>
             </div>

             {/* Window Content */}
             <div className="canvas-window-content">
                <AnimatePresence>
                  {showProperties && selectedNodeId && (
                    <PropertiesModal 
                      nodeId={selectedNodeId} 
                      onClose={() => setShowProperties(false)} 
                    />
                  )}
                </AnimatePresence>

                <div className="canvas-main-area">
                  <div className="canvas-wrap">
                    <Canvas />
                    <FloatingToolbar />
                    
                    {selectedNodeId && (
                      <button 
                        className="node-edit-context-btn"
                        onClick={() => setShowProperties(true)}
                        title="Edit Shape Properties"
                      >
                         <Settings size={14} />
                      </button>
                    )}
                  </div>
                  
                  {showLibrary && (
                    <motion.div
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      transition={{ type: "spring", damping: 25 }}
                      className="library-panel-container"
                    >
                      <LibraryPanel />
                    </motion.div>
                  )}
                </div>
              </div>
           </div>
         </div>
       </div>
    </motion.div>
  );
}
