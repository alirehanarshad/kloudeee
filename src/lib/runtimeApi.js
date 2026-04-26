async function parseJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: text || `HTTP ${response.status}`,
    };
  }
}

async function requestJson(url, options = {}) {
  const { signal: externalSignal, ...fetchOptions } = options;
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), 30000); // 30s timeout

  // Create a combined signal if an external signal is provided
  let signal = timeoutController.signal;
  if (externalSignal) {
    const compositeController = new AbortController();
    
    const onAbort = () => compositeController.abort();
    externalSignal.addEventListener('abort', onAbort);
    timeoutController.signal.addEventListener('abort', onAbort);
    
    signal = compositeController.signal;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
    });
    const parsed = await parseJson(response);

    if (!response.ok && parsed?.ok !== false) {
      return {
        ok: false,
        error: parsed?.error || `HTTP ${response.status}`,
      };
    }

    return parsed;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: 'Request cancelled' };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network request failed',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function postJson(url, payload, options = {}) {
  return requestJson(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
    ...options,
  });
}

export async function pingRuntime() {
  if (window.voltee?.ping) {
    return window.voltee.ping();
  }

  return requestJson('/api/ping');
}

export async function chatWithGroq(payload, options = {}) {
  if (window.voltee?.chatWithGroq) {
    return window.voltee.chatWithGroq(payload, options);
  }

  return postJson('/api/groq/chat', payload, options);
}
