import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store/useStore';
import { useTilt } from '../hooks/useTilt';
import KloudeMark from './KloudeMark';

function Typewriter({ text, speed = 30, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const words = useMemo(() => text.split(' '), [text]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < words.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + (index === 0 ? '' : ' ') + words[index]);
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      if (onComplete) onComplete();
    }
  }, [index, words, speed, onComplete]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {displayedText}
    </ReactMarkdown>
  );
}

function ChatPanel({ onSendMessage }) {
  const [draft, setDraft] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messages = useStore((state) => state.messages);
  const agentStatus = useStore((state) => state.agentStatus);
  const isGenerating = useStore((state) => state.isGenerating);
  const stopGeneration = useStore((state) => state.stopGeneration);
  const setMessageComplete = useStore((state) => state.setMessageComplete);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show button if we are more than 200px from bottom
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200);
  };

  const submitDraft = (value) => {
    const next = value.trim();
    if (!next || agentStatus === 'thinking') return;
    try {
      const maybePromise = onSendMessage(next);
      if (maybePromise && typeof maybePromise.then === 'function' && typeof maybePromise.catch === 'function') {
        maybePromise.catch((error) => {
          console.error('sendMessage failed:', error);
        });
      }
    } catch (error) {
      console.error('sendMessage failed:', error);
    }
    setDraft('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitDraft(draft);
  };

  return (
    <div className="kloude-chat-shell">
      <div className="kloude-stage-backdrop" aria-hidden="true">
        <div className="kloude-stage-grid"></div>
        <div className="kloude-stage-beam beam-left"></div>
        <div className="kloude-stage-beam beam-right"></div>
      </div>



      <div className="kloude-chat-page">
        <div className="kloude-chat-scroll" ref={scrollRef} onScroll={handleScroll}>
          {messages.length === 0 && (
            <div className="kloude-chat-welcome">
              <div className="kloude-welcome-icon">
                <KloudeMark size={56} />
              </div>

              <h1 className="kloude-welcome-title">Hey, I&apos;m Kloude</h1>
              <p className="kloude-welcome-sub">
                Your cloud architecture expert. Ask me anything about AWS, Azure, GCP, Terraform, Kubernetes, and more.
              </p>

              <div className="kloude-suggestion-grid">
                <SuggestionCard
                  eyebrow="Build"
                  text="Design a 3-tier web app on AWS"
                  onClick={() => submitDraft('Design a 3-tier web application architecture on AWS with auto-scaling and RDS.')}
                />
                <SuggestionCard
                  eyebrow="Secure"
                  text="Explain IAM best practices"
                  onClick={() => submitDraft('What are the IAM best practices for a production AWS environment?')}
                />
                <SuggestionCard
                  eyebrow="Compare"
                  text="Kubernetes vs ECS comparison"
                  onClick={() => submitDraft('Compare Kubernetes (EKS) vs ECS for container orchestration. When should I use each?')}
                />
                <SuggestionCard
                  eyebrow="Optimize"
                  text="Cloud cost optimization tips"
                  onClick={() => submitDraft('What are the top strategies for reducing cloud costs on AWS?')}
                />
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`kloude-msg kloude-msg-${message.role}`}>
              {message.role === 'assistant' && (
                <div className="kloude-msg-avatar">
                  <KloudeMark size={24} />
                </div>
              )}
              <div className="kloude-msg-bubble">
                {message.role === 'assistant' ? (
                  <div className="kloude-markdown">
                    {!message.isComplete && messages[messages.length - 1].id === message.id ? (
                      <Typewriter text={message.content} onComplete={() => setMessageComplete(message.id)} />
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                ) : (
                  <span>{message.content}</span>
                )}
              </div>
            </div>
          ))}

          {agentStatus === 'thinking' && (
            <div className="kloude-msg kloude-msg-assistant">
              <div className="kloude-msg-avatar pulsing">
                <KloudeMark size={24} />
              </div>
              <div className="kloude-msg-bubble">
                <div className="kloude-thinking-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {showScrollButton && (
          <button 
            className="kloude-scroll-bottom-btn" 
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </button>
        )}

        <div className="kloude-composer-area">
          <form className="kloude-composer" onSubmit={handleSubmit}>
            <div className="kloude-composer-glow" aria-hidden="true"></div>
            <textarea
              className="kloude-composer-input"
              placeholder="Ask Kloude anything about cloud..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitDraft(draft);
                }
              }}
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight) + 'px';
              }}
            />
            <div className="kloude-composer-actions">
              {isGenerating ? (
                <button
                  type="button"
                  className="kloude-stop-btn"
                  onClick={stopGeneration}
                  aria-label="Stop generating"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="kloude-send-btn"
                  disabled={!draft.trim() || agentStatus === 'thinking'}
                  aria-label="Send message"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              )}
            </div>
          </form>
          <div className="kloude-disclaimer">Kloude can make mistakes. Always validate infrastructure before deploying.</div>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ eyebrow, text, onClick }) {
  const tiltRef = useTilt({ max: 9 });

  return (
    <button className="kloude-suggestion-card" onClick={onClick} type="button" ref={tiltRef}>
      <span className="kloude-suggestion-sheen" aria-hidden="true"></span>

      <span className="kloude-suggestion-copy">

        <span className="kloude-suggestion-text">{text}</span>
      </span>
    </button>
  );
}



export default ChatPanel;
