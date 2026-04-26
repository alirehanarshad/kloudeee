const DEFAULT_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const MAX_SYSTEM_PROMPT_CHARS = 24000;
const MAX_USER_TEXT_CHARS = 12000;

function trimText(value, maxChars) {
  const text = String(value || '');
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated]`;
}

function summarizeScene(scene) {
  if (!scene || typeof scene !== 'object') return '';
  return trimText(JSON.stringify(scene), 1500);
}

function summarizeComponents(components) {
  if (!Array.isArray(components) || !components.length) return '';

  return trimText(
    components
      .slice(0, 60)
      .map((component) =>
        [
          component.id,
          component.name,
          component.provider,
          component.category || component.partClass,
        ]
          .filter(Boolean)
          .join(' | ')
      )
      .join('\n'),
    4000,
  );
}

function buildUserContent(payload = {}) {
  const content = [];

  if (payload.userPrompt) {
    content.push({ type: 'text', text: trimText(payload.userPrompt, MAX_USER_TEXT_CHARS) });
  }

  if (payload.scene) {
    content.push({ type: 'text', text: `Scene:\n${summarizeScene(payload.scene)}` });
  }

  if (payload.components) {
    content.push({ type: 'text', text: `Components:\n${summarizeComponents(payload.components)}` });
  }

  if (payload.imageBase64) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${payload.imageMimeType || 'image/png'};base64,${payload.imageBase64}`,
      },
    });
  }

  return content;
}

export async function invokeGroqChat(payload = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY in .env');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: payload.model || DEFAULT_MODEL,
      temperature: payload.temperature ?? 0.7,
      messages: [
        ...(payload.systemPrompt ? [{ role: 'system', content: trimText(payload.systemPrompt, MAX_SYSTEM_PROMPT_CHARS) }] : []),
        { role: 'user', content: buildUserContent(payload) },
      ],
      ...(payload.responseFormat ? { response_format: payload.responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message?.content;

  return { raw: data, content: message };
}
