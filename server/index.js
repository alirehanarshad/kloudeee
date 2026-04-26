import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { invokeGroqChat } from './groq.js';
import { invokeGeminiChat } from './gemini.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 8787);

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    // Increased limit to 10MB to accommodate expanded prompts and large catalogs
    if (size > 10_000_000) {
      throw new Error('Request body too large.');
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON request body.');
  }
}

async function invokeChatWithFallback(payload) {
  try {
    const result = await invokeGroqChat(payload);
    return {
      provider: 'groq',
      fallbackUsed: false,
      result,
    };
  } catch (groqError) {
    const geminiResult = await invokeGeminiChat(payload);
    return {
      provider: 'gemini',
      fallbackUsed: true,
      fallbackReason: groqError instanceof Error ? groqError.message : 'Groq request failed',
      result: geminiResult,
    };
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { ok: false, error: 'Not found' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    if (req.method === 'GET' && req.url === '/api/ping') {
      sendJson(res, 200, {
        ok: true,
        runtime: 'node-http',
        node: process.versions.node,
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/groq/chat') {
      const payload = await readBody(req);
      const chat = await invokeChatWithFallback(payload);
      sendJson(res, 200, {
        ok: true,
        data: chat.result,
        provider: chat.provider,
        fallbackUsed: chat.fallbackUsed,
        fallbackReason: chat.fallbackReason,
      });
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Route not found' });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      where: path.relative(process.cwd(), __dirname),
    });
  }
});

server.on('error', (error) => {
  if (error && typeof error === 'object' && error.code === 'EADDRINUSE') {
    console.error(`Voltee API port ${PORT} is already in use. Set PORT in .env (example: PORT=8788) or stop the other process.`);
    process.exit(1);
  }

  console.error('Voltee API server error:', error);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Voltee API listening on http://localhost:${PORT}`);
});
