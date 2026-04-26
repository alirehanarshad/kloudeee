import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import Orb3D from './Orb3D';
import KloudeMark from './KloudeMark';

export default function KloudeHome({ onStartChat }) {
  const [prompt, setPrompt] = useState('');
  const pushToast = useStore((s) => s.pushToast);
  const promptInputRef = useRef(null);

  const focusPrompt = () => promptInputRef.current?.focus();

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onStartChat(trimmed);
    setPrompt('');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="gemini-main">
      <Orb3D className="gemini-orb-bg" />
      
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="gemini-header"
      >
        <button className="voltee-header-brand" type="button" onClick={focusPrompt} aria-label="Kloude home">
          <KloudeMark size={28} />
          <span className="voltee-header-name">Kloude</span>
        </button>
        <div className="gemini-header-right">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="gemini-upgrade-btn" 
            type="button" 
            onClick={() => pushToast('Kloude Pro is coming soon.', 'info')}
          >
            <span className="voltee-pill">Architect</span>
            Upgrade to Pro
          </motion.button>
          <div className="gemini-avatar" title="Profile">AR</div>
        </div>
      </motion.header>

      <div className="gemini-center-content">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="voltee-hero-card"
        >
          <motion.div variants={itemVariants} className="gemini-greeting">
            <motion.span 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="gemini-sparkle"
            >
              <KloudeMark size={48} />
            </motion.span>
            <div className="gemini-hi-text">Design the future of Cloud.</div>
             <p className="voltee-subcopy">
              Explain your infrastructure requirements. I'll architect the cloud and optimize for cost and scale.
             </p>
          </motion.div>

          <motion.form 
            variants={itemVariants}
            className="gemini-input-container" 
            onSubmit={handleSubmit}
            whileFocus={{ scale: 1.01 }}
          >
            <button type="button" className="gemini-round-icon-btn plus-btn" aria-label="Quick actions" onClick={() => pushToast('Templates coming soon.', 'info')}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
            </button>
            <input
              ref={promptInputRef}
              type="text"
              className="gemini-input"
              placeholder="How can Kloude help accelerate your architecture today?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="gemini-input-actions">
              <motion.button 
                whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                type="button" 
                className="gemini-fast-btn" 
                aria-label="Mode"
              >
                Architect V1
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M7 10l5 5 5-5z" />
                </svg>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="submit" 
                className="gemini-round-icon-btn send-btn" 
                aria-label="Send"
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </motion.button>
            </div>
          </motion.form>

          <motion.div variants={itemVariants} className="gemini-suggestions">
            <SuggestionChip text="Scale an EKS cluster with multi-az" onClick={() => setPrompt("Architect a multi-AZ AWS EKS cluster with autoscaling.")} />
            <SuggestionChip text="Azure Hub-Spoke topology" onClick={() => setPrompt("Design an Azure Hub-Spoke network topology with Firewall.")} />
            <SuggestionChip text="Serverless image processing" onClick={() => setPrompt("Build a serverless image processing pipeline using AWS Lambda.")} />
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

function SuggestionChip({ text, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02, backgroundColor: "rgba(66, 188, 244, 0.1)" }}
      whileTap={{ scale: 0.98 }}
      className="suggestion-chip"
      onClick={onClick}
    >
      {text}
    </motion.button>
  );
}
