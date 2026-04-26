function randomInt(limit = 10_000_000) {
  return Math.floor(Math.random() * limit);
}

export const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).substring(2, 11) + randomInt().toString(36);
  }
};

export function baseElement(type, x, y) {
  const now = Date.now();

  return {
    id: generateId(),
    type,
    x,
    y,
    angle: 0,
    strokeColor: '#1f2937',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: randomInt(),
    version: 1,
    versionNonce: randomInt(),
    isDeleted: false,
    boundElements: [],
    updated: now,
    link: null,
    locked: false,
    status: 'saved',
  };
}

export async function loadImageFile(url) {
  try {
    let finalUrl = url;
    if (url.startsWith('http')) {
      // Use a proxy to bypass CORS (ResearchGate, etc.)
      finalUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=png`;
    }

    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error(`Passed image load check but failed fetch: ${url}`);
    
    const blob = await response.blob();
    const dataURL = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const dimensions = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error(`Failed to decode image: ${url}`));
      img.src = dataURL;
    });

    return {
      mimeType: blob.type || 'image/png',
      dataURL,
      ...dimensions,
    };
  } catch (err) {
    console.error('loadImageFile error:', err);
    // Fallback dimension to prevent crash
    return {
      mimeType: 'image/png',
      dataURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      width: 100,
      height: 100,
    };
  }
}

export async function processImage(dataURL) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataURL);
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 1. Remove White/Bright Background
      // We look for pixels where R, G, and B are all > 240
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (brightness > 245) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // 2. Simple Sharpening using Canvas filter if supported
      if (typeof ctx.filter === 'string') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
        tempCtx.drawImage(canvas, 0, 0);
        resolve(tempCanvas.toDataURL('image/png'));
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    };
    img.onerror = () => resolve(dataURL); // Fallback to original
    img.src = dataURL;
  });
}

export function fitDimensions(width, height, maxWidth = 450, maxHeight = 320) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

  return {
    width: Math.max(64, Math.round(width * ratio)),
    height: Math.max(64, Math.round(height * ratio)),
  };
}

export function createImageElement(component, fileId, x, y, width, height) {
  return {
    ...baseElement('image', x, y),
    fileId,
    width,
    height,
    scale: [1, 1],
    crop: null,
    strokeColor: 'transparent',
    status: 'saved',
  };
}

export function createTextElement(text, x, y, options = {}) {
  const fontSize = options.fontSize || 16;
  const lineHeight = options.lineHeight || 1.25;
  const width = options.width || Math.max(40, Math.round(text.length * fontSize * 0.56));
  const height = options.height || Math.max(20, Math.round(fontSize * lineHeight));

  return {
    ...baseElement('text', x, y),
    width,
    height,
    strokeColor: options.strokeColor || '#111827',
    backgroundColor: options.backgroundColor || '#ffffff',
    fillStyle: 'solid',
    strokeWidth: 0,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    text,
    originalText: text,
    fontSize,
    fontFamily: options.fontFamily || 5,
    textAlign: options.textAlign || 'left',
    verticalAlign: options.verticalAlign || 'middle',
    containerId: null,
    lineHeight,
    baseline: Math.round(fontSize),
  };
}

export function createPinLabel(pinName, x, y, color = '#374151', side = 'right') {
  const fontSize = 11;
  const labelWidth = Math.max(24, Math.round(pinName.length * fontSize * 0.6));
  const offsetX = side === 'left' ? -(labelWidth + 6) : 6;
  const offsetY = -7;

  return {
    ...baseElement('text', x + offsetX, y + offsetY),
    width: labelWidth,
    height: 14,
    strokeColor: color,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 0,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    text: pinName,
    originalText: pinName,
    fontSize,
    fontFamily: 3,
    textAlign: side === 'left' ? 'right' : 'left',
    verticalAlign: 'middle',
    containerId: null,
    lineHeight: 1.2,
    baseline: Math.round(fontSize),
  };
}

export function createComponentLabel(name, element, position = 'above') {
  const fontSize = 16;
  const labelWidth = Math.max(60, Math.round(name.length * fontSize * 0.58));
  const centerX = element.x + element.width / 2 - labelWidth / 2;
  const yPos = position === 'above' ? element.y - 32 : element.y + element.height + 12;

  return {
    ...baseElement('text', centerX, yPos),
    width: labelWidth,
    height: 22,
    strokeColor: '#0f172a',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 0,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    text: name,
    originalText: name,
    fontSize,
    fontFamily: 1,
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId: null,
    lineHeight: 1.25,
    baseline: Math.round(fontSize),
  };
}

export function createCircuitTitle(title, centerX = 900, topY = 20) {
  const fontSize = 32;
  const labelWidth = Math.max(200, Math.round(title.length * fontSize * 0.55));
  const x = centerX - labelWidth / 2;

  return {
    ...baseElement('text', x, topY),
    width: labelWidth,
    height: 40,
    strokeColor: '#0f172a',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 0,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    text: title,
    originalText: title,
    fontSize,
    fontFamily: 1,
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId: null,
    lineHeight: 1.3,
    baseline: Math.round(fontSize),
  };
}

export function createWireLabel(label, points, color = '#374151') {
  if (!label || points.length < 2) return null;

  let longestLen = 0;
  let midX = 0;
  let midY = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (len > longestLen) {
      longestLen = len;
      midX = (a.x + b.x) / 2;
      midY = (a.y + b.y) / 2;
    }
  }

  const fontSize = 12;
  const labelWidth = Math.max(30, Math.round(label.length * fontSize * 0.6));

  return {
    ...baseElement('text', midX - labelWidth / 2, midY - 18),
    width: labelWidth,
    height: 16,
    strokeColor: color,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 0,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    text: label,
    originalText: label,
    fontSize,
    fontFamily: 3,
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId: null,
    lineHeight: 1.2,
    baseline: Math.round(fontSize),
  };
}

export function createWireElement(start, end, color = '#374151') {
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);

  return {
    ...baseElement('line', minX, minY),
    width: maxX - minX,
    height: maxY - minY,
    points: [
      [start.x - minX, start.y - minY],
      [end.x - minX, end.y - minY],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
    strokeColor: color,
    strokeWidth: 3,
  };
}

export function createConnectionTerminal(x, y, color = '#111827') {
  const size = 14;
  return {
    ...baseElement('ellipse', x - size / 2, y - size / 2),
    width: size,
    height: size,
    strokeColor: color,
    backgroundColor: color,
    fillStyle: 'solid',
    strokeWidth: 1,
    roundness: null,
  };
}

export function createRoutedWireElement(points, color = '#374151') {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const relativePoints = points.map((point) => [point.x - minX, point.y - minY]);

  return {
    ...baseElement('line', minX, minY),
    width: maxX - minX,
    height: maxY - minY,
    points: relativePoints,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
    strokeColor: color,
    strokeWidth: 3,
  };
}

export function createOrthogonalPoints(start, end, bias = 'horizontal') {
  if (bias === 'horizontal') {
    return [start, { x: end.x, y: start.y }, end];
  }
  return [start, { x: start.x, y: end.y }, end];
}

export function getPin(component, matchers) {
  return component.pins.find((pin) => {
    const label = String(pin.label || '').toUpperCase();
    const roles = (pin.roles || []).map((role) => String(role).toUpperCase());
    const type = String(pin.type || '').toUpperCase();

    return matchers.some((matcher) =>
      matcher === label ||
      matcher === type ||
      roles.includes(matcher),
    );
  }) || component.pins[0] || null;
}

export function getAnchor(element, pin, sideHint = 'right') {
  if (pin?.coordinate?.x != null && pin?.coordinate?.y != null) {
    return {
      x: element.x + (element.width * pin.coordinate.x) / 100,
      y: element.y + (element.height * pin.coordinate.y) / 100,
    };
  }

  if (sideHint === 'left') return { x: element.x, y: element.y + element.height / 2 };
  if (sideHint === 'top') return { x: element.x + element.width / 2, y: element.y };
  if (sideHint === 'bottom') return { x: element.x + element.width / 2, y: element.y + element.height };
  return { x: element.x + element.width, y: element.y + element.height / 2 };
}

export function getRelativePosition(source, target) {
  const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  return { dx: targetCenter.x - sourceCenter.x, dy: targetCenter.y - sourceCenter.y };
}

export function getSideHint(source, target) {
  const { dx, dy } = getRelativePosition(source, target);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

export function createSceneAppState() {
  return {
    viewBackgroundColor: '#e8f0f8',
    currentItemFontFamily: 1,
    zoom: { value: 0.65 },
  };
}
