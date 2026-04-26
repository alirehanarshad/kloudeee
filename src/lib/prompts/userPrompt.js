// ---------------------------------------------------------------------------
// Kloude Cloud Chatbot – User Prompt Builders
// ---------------------------------------------------------------------------

/**
 * Build a simple conversational user prompt.
 * Includes message history for multi-turn context.
 */
export function buildChatUserPrompt({ prompt, history = [] }) {
  const lines = [];

  // Include last few messages for context (max 10 turns)
  const recentHistory = history.slice(-10);
  if (recentHistory.length > 0) {
    lines.push('Conversation so far:');
    for (const msg of recentHistory) {
      const role = msg.role === 'user' ? 'User' : 'Kloude';
      lines.push(`${role}: ${msg.content}`);
    }
    lines.push('');
  }

  lines.push('User:', String(prompt ?? ''));

  return lines.join('\n');
}

// Keep legacy exports for backward compat
export const buildDesignUserPrompt = ({ prompt }) => buildChatUserPrompt({ prompt });
export const buildFirmwareUserPrompt = ({ prompt }) => buildChatUserPrompt({ prompt });
