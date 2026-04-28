import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { invokeGroqChat } from './groq.js';
import { invokeGeminiChat } from './gemini.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PORT = 8080;
const PORT = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10) || DEFAULT_PORT;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end(text);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.ico':
      return 'image/x-icon';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

function isSubPath(parent, candidate) {
  const parentPath = path.resolve(parent);
  const candidatePath = path.resolve(candidate);
  return candidatePath === parentPath || candidatePath.startsWith(`${parentPath}${path.sep}`);
}

async function trySendStatic(req, res) {
  if (!req.url) return false;
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api')) return false;

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    sendText(res, 400, 'Bad Request');
    return true;
  }

  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const requestedFile = path.resolve(DIST_DIR, `.${requestPath}`);

  if (!isSubPath(DIST_DIR, requestedFile)) {
    sendText(res, 400, 'Bad Request');
    return true;
  }

  const sendFile = async (filePath, status = 200) => {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return false;

    const headers = {
      'Content-Type': getContentType(filePath),
      'Content-Length': stat.size,
    };

    const isHashedAsset = requestPath.startsWith('/assets/');
    if (path.extname(filePath).toLowerCase() === '.html') {
      headers['Cache-Control'] = 'no-store';
    } else if (isHashedAsset) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    res.writeHead(status, headers);
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }

    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      stream.on('error', reject);
      res.on('close', resolve);
      stream.pipe(res);
      stream.on('end', resolve);
    });

    return true;
  };

  try {
    if (await sendFile(requestedFile, 200)) return true;
  } catch {
    // continue to SPA fallback below
  }

  const looksLikeAsset = requestPath.startsWith('/assets/') || Boolean(path.extname(requestPath));
  if (looksLikeAsset) {
    sendText(res, 404, 'Not Found');
    return true;
  }

  try {
    const indexFile = path.resolve(DIST_DIR, 'index.html');
    if (!isSubPath(DIST_DIR, indexFile)) {
      sendText(res, 500, 'Static root misconfigured');
      return true;
    }
    if (await sendFile(indexFile, 200)) return true;
  } catch {
    sendText(res, 404, 'Not Found');
    return true;
  }

  return true;
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
    if (await trySendStatic(req, res)) {
      return;
    }

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
    console.error(
      `Kloudeee API port ${PORT} is already in use. Set PORT (example: PORT=8081) or stop the other process.`
    );
    process.exit(1);
  }

  console.error('Kloudeee API server error:', error);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Kloudeee API listening on http://localhost:${PORT}`);
});
