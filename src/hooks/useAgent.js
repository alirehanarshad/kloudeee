import { chatWithGroq } from '../lib/runtimeApi';
import { useStore } from '../store/useStore';
import { SYSTEM_PROMPT_CHATBOT } from '../lib/prompts/systemPrompt';
import { buildChatUserPrompt } from '../lib/prompts/userPrompt';

const MEMORY_KEY = 'kloude:memory';

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMemory(facts) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(facts.slice(-20))); // Keep last 20 facts
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Kloude Cloud Chatbot Hook
// ---------------------------------------------------------------------------

export function useChat() {
  const pushMessage = useStore((state) => state.pushMessage);
  const setAgentStatus = useStore((state) => state.setAgentStatus);
  const setIsGenerating = useStore((state) => state.setIsGenerating);
  const setAbortController = useStore((state) => state.setAbortController);
  const messages = useStore((state) => state.messages);

  const sendMessage = async (prompt) => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    
    pushMessage('user', prompt);
    setAgentStatus('thinking');

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const facts = loadMemory();
      const memoryContext = facts.length > 0 
        ? `\n\n## Global Knowledge (Memory of previous sessions):\n${facts.map(f => `- ${f}`).join('\n')}`
        : '';

      const systemPrompt = SYSTEM_PROMPT_CHATBOT + memoryContext + `\n\nFinal Instruction: If you learn any important NEW facts about the user (name, preferences, specific project details), list them briefly as bullet points at the very end of your response inside <MEMORY>...</MEMORY> tags. Example: <MEMORY>- User's name is Alex\n- Prefers AWS EKS</MEMORY>`;

      const userPrompt = buildChatUserPrompt({ prompt, history });

      const response = await chatWithGroq({
        systemPrompt,
        userPrompt,
      }, { signal: controller.signal });

      if (response?.ok) {
        let content = response.data?.content || 'I received your message but got an empty response.';
        
        // Extract memory
        const memoryMatch = content.match(/<MEMORY>([\s\S]*?)<\/MEMORY>/);
        if (memoryMatch) {
          const newFacts = memoryMatch[1].split('\n').map(f => f.replace(/^-\s*/, '').trim()).filter(Boolean);
          if (newFacts.length > 0) {
            const currentFacts = loadMemory();
            const uniqueFacts = Array.from(new Set([...currentFacts, ...newFacts]));
            saveMemory(uniqueFacts);
          }
          content = content.replace(/<MEMORY>[\s\S]*?<\/MEMORY>/, '').trim();
        }

        pushMessage('assistant', content);
      } else {
        if (response?.error !== 'Request cancelled') {
          pushMessage(
            'assistant',
            `I'm having trouble connecting right now. Error: ${response?.error || 'Unknown error'}.`,
          );
        }
      }

      setAgentStatus('idle');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Handled
      } else {
        pushMessage(
          'assistant',
          `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}.`,
        );
        setAgentStatus('error');
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  return { sendMessage };
}

// Legacy export alias
export const useAgent = () => {
  const { sendMessage } = useChat();
  return { sendPrompt: sendMessage, generateFirmware: () => {} };
};
