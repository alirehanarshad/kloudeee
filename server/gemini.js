const DEFAULT_MODEL = 'gemini-2.5-flash';
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

function buildPromptText(payload = {}) {
  const sections = [];

  if (payload.userPrompt) {
    sections.push(trimText(payload.userPrompt, MAX_USER_TEXT_CHARS));
  }

  if (payload.scene) {
    sections.push(`Scene:\n${summarizeScene(payload.scene)}`);
  }

  if (payload.components) {
    sections.push(`Components:\n${summarizeComponents(payload.components)}`);
  }

  return sections.join('\n\n');
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => part?.text || '')
    .filter(Boolean)
    .join('\n');
}

export async function invokeGeminiChat(payload = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in .env');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${payload.model || DEFAULT_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        ...(payload.systemPrompt
          ? {
              system_instruction: {
                parts: [{ text: trimText(payload.systemPrompt, MAX_SYSTEM_PROMPT_CHARS) }],
              },
            }
          : {}),
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildPromptText(payload),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: payload.temperature ?? 0.7,
          ...(payload.responseMimeType ? { responseMimeType: payload.responseMimeType } : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = extractText(data);

  if (!content) {
    throw new Error('Gemini API returned no text content.');
  }

  return { raw: data, content };
}
