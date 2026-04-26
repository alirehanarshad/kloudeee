import { create } from 'zustand';
import {
  createImageElement,
  createSceneAppState,
  createRoutedWireElement,
  createConnectionTerminal,
  createPinLabel,
  createComponentLabel,
  createCircuitTitle,
  createWireLabel,
  fitDimensions,
  getAnchor,
  getPin,
  getSideHint,
  loadImageFile,
  generateId,
} from '../lib/sceneUtils';

const initialMessages = [];

function createEmptyScene() {
  return {
    elements: [],
    files: {},
    appState: createSceneAppState(),
  };
}

const WIRE_COLORS = {
  ground: '#1e293b',
  power: '#ef4444',
  sda: '#3b82f6',
  scl: '#0d9488',
  analog: '#f59e0b',
  digital: '#10b981',
  i2s_sd: '#8b5cf6',
  i2s_ws: '#ec4899',
  i2s_sck: '#06b6d4',
  uart_tx: '#3b82f6',
  uart_rx: '#0d9488',
  spi_mosi: '#3b82f6',
  spi_miso: '#0d9488',
  spi_sck: '#8b5cf6',
  spi_cs: '#f59e0b',
  extra: '#6366f1',
};

function findMatchingPin(component, matchers = []) {
  if (!component?.pins?.length) return null;
  return getPin(component, matchers.map((item) => String(item).toUpperCase()));
}

function hasInterface(component, name) {
  return (component?.interfaces || []).some((item) => String(item).toUpperCase() === String(name).toUpperCase());
}

function isGroundPin(pin) {
  const label = String(pin?.label || '').toUpperCase();
  const type = String(pin?.type || '').toUpperCase();
  return label === 'GND' || label === 'G' || type === 'GND';
}

function isPowerPin(pin) {
  const label = String(pin?.label || '').toUpperCase();
  const type = String(pin?.type || '').toUpperCase();
  return ['VCC', 'VIN', 'VDD', '3V3', '5V', '+'].includes(label) || type === 'PWR_IN' || type === 'PWR_OUT';
}

function getProfessionalLayoutPosition(index) {
  const startX = 1200;
  const startY = 150;
  const spacingY = 400;
  const column = Math.floor(index / 3);
  const row = index % 3;

  return {
    x: startX + column * 500,
    y: startY + row * spacingY,
  };
}

function addResolvedConnection(connections, sourceItem, targetItem, sourcePin, targetPin, color, signalName = '') {
  if (!sourceItem || !targetItem || !sourcePin || !targetPin) return;

  const key = [sourceItem.component.id, targetItem.component.id, sourcePin.id, targetPin.id].join('::');
  if (connections.some((item) => item.key === key)) return;

  connections.push({
    key,
    sourceId: sourceItem.component.id,
    targetId: targetItem.component.id,
    sourcePin,
    targetPin,
    color,
    signalName: signalName || sourcePin.label || 'SIG',
  });
}

function buildAutoConnections(imageElements, plannedConnections = []) {
  const controller = imageElements.find((item) => item.component.partClass === 'controller_board' || item.component.category === 'controller')
    || imageElements[0]
    || null;
  if (!controller) return [];

  const connections = [];
  const byId = new Map(imageElements.map((item) => [item.component.id, item]));

  for (const planned of Array.isArray(plannedConnections) ? plannedConnections : []) {
    const sourceItem = byId.get(planned?.sourceId);
    const targetItem = byId.get(planned?.targetId);
    const sourcePin = planned?.sourcePin || findMatchingPin(sourceItem?.component, planned?.sourceMatchers || []);
    const targetPin = planned?.targetPin || findMatchingPin(targetItem?.component, planned?.targetMatchers || []);
    if (!sourceItem || !targetItem || !sourcePin || !targetPin) continue;

    addResolvedConnection(
      connections,
      sourceItem,
      targetItem,
      sourcePin,
      targetPin,
      planned.color || WIRE_COLORS.digital,
      planned.signalName,
    );
  }

  for (const item of imageElements) {
    if (item.component.id === controller.component.id) continue;
    const category = item.component.category;
    if (category === 'prototyping' || category === 'passive') continue;

    const controllerGround = findMatchingPin(controller.component, ['GND', 'G']);
    const targetGround = item.component.pins.find(isGroundPin) || null;
    addResolvedConnection(connections, controller, item, controllerGround, targetGround, WIRE_COLORS.ground, 'GND');

    if (category !== 'power') {
      const targetPower = item.component.pins.find((pin) => isPowerPin(pin) && !isGroundPin(pin)) || null;
      const controllerPower = findMatchingPin(controller.component, ['3V3', '5V', 'PWR_OUT']);
      addResolvedConnection(connections, controller, item, controllerPower, targetPower, WIRE_COLORS.power, controllerPower?.label || '3V3');
    }

    if (hasInterface(item.component, 'I2S')) {
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['I2S_SD', 'GPIO6', '6']), findMatchingPin(item.component, ['SD', 'DATA', 'DOUT']), WIRE_COLORS.i2s_sd, 'SD');
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['I2S_SCK', 'GPIO4', '4']), findMatchingPin(item.component, ['SCK', 'CLK', 'BCLK']), WIRE_COLORS.i2s_sck, 'SCK');
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['I2S_WS', 'GPIO5', '5']), findMatchingPin(item.component, ['WS', 'LRC', 'LRCLK']), WIRE_COLORS.i2s_ws, 'WS');
    }

    if (hasInterface(item.component, 'I2C')) {
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['SDA', 'GPIO8', '8', 'A4']), findMatchingPin(item.component, ['SDA']), WIRE_COLORS.sda, 'SDA');
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['SCL', 'GPIO9', '9', 'A5']), findMatchingPin(item.component, ['SCL']), WIRE_COLORS.scl, 'SCL');
    }

    if (hasInterface(item.component, 'SPI')) {
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['MOSI', 'GPIO6', 'D11']), findMatchingPin(item.component, ['MOSI']), WIRE_COLORS.spi_mosi, 'MOSI');
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['MISO', 'GPIO3', 'D12']), findMatchingPin(item.component, ['MISO']), WIRE_COLORS.spi_miso, 'MISO');
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['SCK', 'GPIO4', 'D13']), findMatchingPin(item.component, ['SCK']), WIRE_COLORS.spi_sck, 'SCK');
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['CS', 'GPIO7', 'D10']), findMatchingPin(item.component, ['CS', 'CSN']), WIRE_COLORS.spi_cs, 'CS');
    }

    if (hasInterface(item.component, 'UART')) {
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['TX', 'GPIO7']), findMatchingPin(item.component, ['RX']), WIRE_COLORS.uart_tx, 'TX');
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['RX', 'GPIO3']), findMatchingPin(item.component, ['TX']), WIRE_COLORS.uart_rx, 'RX');
    }

    if (hasInterface(item.component, 'ADC')) {
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['A0', 'ADC', 'GPIO1']), findMatchingPin(item.component, ['A0', 'ANALOG']), WIRE_COLORS.analog, 'A0');
    }

    if (hasInterface(item.component, 'SINGLE_WIRE') || hasInterface(item.component, 'PWM') || hasInterface(item.component, 'GPIO')) {
      addResolvedConnection(connections, controller, item, findMatchingPin(controller.component, ['PWM', 'DATA', 'GPIO2', 'D2', 'D3']), findMatchingPin(item.component, ['DATA', 'SIG', 'DIN', 'TRIG']), WIRE_COLORS.digital, 'SIG');
    }
  }

  return connections;
}

function routeBundle(start, end, globalLane = 0) {
  const isRight = end.x > start.x;
  const gutter = isRight ? 160 : -160;
  const laneOffset = globalLane * 20;
  const midX = start.x + gutter + laneOffset;

  return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
}

async function buildSceneForComponents(selected, plannedConnections = [], circuitSummary = '') {
  if (!Array.isArray(selected) || selected.length === 0) {
    return createEmptyScene();
  }

  const files = {};
  const imageElements = [];
  const controller = selected.find((component) => component.partClass === 'controller_board' || component.category === 'controller')
    || selected[0]
    || null;
  const peripherals = selected.filter((component) => component.id !== controller?.id);

  for (let index = 0; index < selected.length; index += 1) {
    const component = selected[index];
    const file = await loadImageFile(component.image);
    const fileId = generateId();
    const isController = component.id === controller?.id;
    const maxDim = isController ? 450 : 350;
    const { width, height } = fitDimensions(file.width, file.height, maxDim, maxDim);
    const position = isController
      ? { x: 400, y: 350 }
      : getProfessionalLayoutPosition(Math.max(0, peripherals.indexOf(component)));

    files[fileId] = {
      id: fileId,
      mimeType: file.mimeType,
      dataURL: file.dataURL,
      created: Date.now(),
      lastRetrieved: Date.now(),
    };
    imageElements.push({
      component,
      element: createImageElement(component, fileId, position.x, position.y, width, height),
    });
  }

  const connections = buildAutoConnections(imageElements, plannedConnections);
  const wires = [];
  const labels = [];

  labels.push(createCircuitTitle(circuitSummary || controller?.name || 'Circuit Design', 1000, 40));

  connections.forEach((connection, index) => {
    const source = imageElements.find((item) => item.component.id === connection.sourceId);
    const target = imageElements.find((item) => item.component.id === connection.targetId);
    if (!source || !target) return;

    const sourceSide = getSideHint(source.element, target.element);
    const targetSide = getSideHint(target.element, source.element);
    const start = getAnchor(source.element, connection.sourcePin, sourceSide);
    const end = getAnchor(target.element, connection.targetPin, targetSide);

    labels.push(createConnectionTerminal(start.x, start.y, connection.color));
    labels.push(createConnectionTerminal(end.x, end.y, connection.color));

    if (connection.sourcePin?.label) {
      labels.push(createPinLabel(connection.sourcePin.label, start.x, start.y, connection.color, sourceSide === 'left' ? 'left' : 'right'));
    }
    if (connection.targetPin?.label) {
      labels.push(createPinLabel(connection.targetPin.label, end.x, end.y, connection.color, targetSide === 'left' ? 'left' : 'right'));
    }

    const points = routeBundle(start, end, index);
    wires.push(createRoutedWireElement(points, connection.color));
    if (connection.signalName) {
      labels.push(createWireLabel(connection.signalName, points, connection.color));
    }
  });

  for (const item of imageElements) {
    labels.push(createComponentLabel(item.component.name, item.element, 'above'));
  }

  return {
    elements: [...imageElements.map((item) => item.element), ...wires, ...labels.filter(Boolean)],
    files,
    appState: createSceneAppState(),
  };
}

function saveCustomComponents(next) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('kloude-arc.custom-lib', JSON.stringify(next));
  }
}

function readCustomComponents() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem('kloude-arc.custom-lib');
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const useStore = create((set, get) => ({
  currentSessionId: null,
  componentsCatalog: [],
  scene: createEmptyScene(),
  sceneId: 0,
  sceneVersion: 0,
  canvasApi: null,
  flowNodes: [],
  flowEdges: [],
  messages: initialMessages,
  selectedNodeId: null,
  agentStatus: 'idle',
  isGenerating: false,
  abortController: null,
  backendStatus: 'unknown',
  toasts: [],
  generatedCode: '',
  generatedFilename: 'infrastructure.tf',
  selectedProvider: 'aws',
  canvasStates: {
    aws: { nodes: [], edges: [] },
    azure: { nodes: [], edges: [] },
    gcp: { nodes: [], edges: [] }
  },
  lastComponentIds: [],
  buildStatus: 'idle',
  buildLogs: '',
  customComponents: readCustomComponents(),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setSelectedProvider: (provider) => set((state) => {
    // Save current active state to its provider bucket
    const currentProvider = state.selectedProvider;
    const updatedCanvasStates = {
      ...state.canvasStates,
      [currentProvider]: {
        nodes: state.flowNodes || [],
        edges: state.flowEdges || []
      }
    };

    // Load target provider's bucket state
    const target = updatedCanvasStates[provider] || { nodes: [], edges: [] };

    return {
      selectedProvider: provider,
      canvasStates: updatedCanvasStates,
      flowNodes: target.nodes,
      flowEdges: target.edges,
      selectedNodeId: null
    };
  }),
  loadSessionState: (sessionData) => set((state) => ({
    currentSessionId: sessionData.id,
    scene: sessionData.scene || createEmptyScene(),
    sceneVersion: state.sceneVersion + 1,
    flowNodes: Array.isArray(sessionData.flowNodes) ? sessionData.flowNodes : [],
    flowEdges: Array.isArray(sessionData.flowEdges) ? sessionData.flowEdges : [],
    messages: sessionData.messages || initialMessages,
    generatedCode: sessionData.generatedCode || '',
    generatedFilename: sessionData.generatedFilename || 'infrastructure.tf',
    lastComponentIds: sessionData.lastComponentIds || [],
    selectedNodeId: null,
    agentStatus: 'idle',
    buildStatus: 'idle',
    buildLogs: '',
  })),
  setComponentsCatalog: (componentsCatalog) => set({ componentsCatalog }),
  setCanvasApi: (canvasApi) => set({ canvasApi }),
  setFlowNodes: (flowNodes) => set({ flowNodes: Array.isArray(flowNodes) ? flowNodes : [] }),
  setFlowEdges: (flowEdges) => set({ flowEdges: Array.isArray(flowEdges) ? flowEdges : [] }),
  setBackendStatus: (backendStatus) => set({ backendStatus }),
  setAgentStatus: (agentStatus) => set({ agentStatus }),
  setGeneratedFirmware: ({ code = '', filename = 'infrastructure.tf' }) => set({ generatedCode: code, generatedFilename: filename }),
  setBuildResult: ({ buildStatus = 'idle', buildLogs = '' }) => set({ buildStatus, buildLogs }),
  pushToast: (message, variant = 'info') => {
    const toast = {
      id: generateId(),
      message: String(message || ''),
      variant: String(variant || 'info'),
      ts: Date.now(),
    };
    set((state) => ({ toasts: [...(state.toasts || []), toast].slice(-4) }));
    return toast.id;
  },
  removeToast: (id) => set((state) => ({ toasts: (state.toasts || []).filter((t) => t.id !== id) })),
  updateScene: (elements, appState, files) => set({ scene: { elements, appState, files } }),
  addToCustomLibrary: (item) => set((state) => {
    const next = [...state.customComponents, item];
    saveCustomComponents(next);
    return { customComponents: next };
  }),
  removeFromCustomLibrary: (id) => set((state) => {
    const next = state.customComponents.filter((component) => component.id !== id);
    saveCustomComponents(next);
    return { customComponents: next };
  }),
  resetSession: () => set((state) => ({
    currentSessionId: null,
    scene: createEmptyScene(),
    sceneVersion: state.sceneVersion + 1,
    canvasApi: state.canvasApi,
    flowNodes: [],
    flowEdges: [],
    messages: initialMessages,
    selectedNodeId: null,
    agentStatus: 'idle',
    toasts: [],
    generatedCode: '',
    generatedFilename: 'infrastructure.tf',
    lastComponentIds: [],
    buildStatus: 'idle',
    buildLogs: '',
  })),
  clearCanvas: () => set((state) => ({
    scene: createEmptyScene(),
    sceneVersion: state.sceneVersion + 1,
    canvasApi: state.canvasApi,
    flowNodes: [],
    flowEdges: [],
    selectedNodeId: null,
    generatedCode: '',
    generatedFilename: 'infrastructure.tf',
    lastComponentIds: [],
    buildStatus: 'idle',
    buildLogs: '',
  })),
  removeNode: (nodeId) => set((state) => ({
    flowNodes: (state.flowNodes || []).filter((n) => n.id !== nodeId),
    flowEdges: (state.flowEdges || []).filter((e) => e.source !== nodeId && e.target !== nodeId),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
  })),
  clearCanvas: () => set({ flowNodes: [], flowEdges: [], selectedNodeId: null }),
  updateNodeData: (nodeId, newData) => set((state) => ({
    flowNodes: (state.flowNodes || []).map((n) => 
      n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
    )
  })),
  duplicateNode: (nodeId) => {
    const { flowNodes } = get();
    const node = flowNodes.find((n) => n.id === nodeId);
    if (!node) return;
    const newNode = {
      ...node,
      id: generateId(),
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: false,
    };
    set((state) => ({
      flowNodes: [...state.flowNodes, newNode],
      selectedNodeId: newNode.id
    }));
  },
  loadPersistedScene: (scene) => set((state) => ({
    scene,
    sceneVersion: state.sceneVersion + 1,
    selectedNodeId: scene?.elements?.find((element) => element.type === 'image')?.id ?? null,
  })),
  pushMessage: (role, content) => set((state) => ({
    messages: [...state.messages, { id: generateId(), role, content, isComplete: role === 'user' }],
  })),
  setMessageComplete: (id) => set((state) => ({
    messages: state.messages.map((m) => m.id === id ? { ...m, isComplete: true } : m)
  })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setAbortController: (abortController) => set({ abortController }),
  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) abortController.abort();
    set({ isGenerating: false, abortController: null, agentStatus: 'idle' });
  },
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  addNodeFromComponent: async (componentId) => {
    const { componentsCatalog } = get();
    const component = componentsCatalog.find((item) => item.id === componentId);
    if (!component) return;

    set((state) => {
      const nextIndex = (state.flowNodes || []).length;
      const x = 300 + (nextIndex % 5) * 80;
      const y = 200 + Math.floor(nextIndex / 5) * 80;
      const nodeId = generateId();

      return {
        flowNodes: [
          ...(state.flowNodes || []),
          {
            id: nodeId,
            type: 'imageNode',
            position: { x, y },
            data: { 
              label: component.name, 
              image: component.image, 
              componentId: component.id,
              fontSize: 12,
              opacity: 1,
              color: '#ffffff'
            },
          },
        ],
        selectedNodeId: nodeId,
      };
    });
  },
  addGenericImage: async (dataURL, name = 'Custom Image') => {
    set((state) => {
      const nextIndex = (state.flowNodes || []).length;
      const column = Math.floor(nextIndex / 3);
      const row = nextIndex % 3;
      const x = 280 + column * 320;
      const y = 140 + row * 240;
      const nodeId = generateId();

      return {
        flowNodes: [
          ...(state.flowNodes || []),
          {
            id: nodeId,
            type: 'imageNode',
            position: { x, y },
            data: { label: name, image: dataURL, componentId: nodeId },
          },
        ],
        selectedNodeId: nodeId,
      };
    });
  },
  buildDraftGraph: async (componentIds, connections = [], summary = '') => {
    const { componentsCatalog } = get();
    const selected = componentIds
      .map((id) => componentsCatalog.find((item) => item.id === id))
      .filter(Boolean);

    const controller = selected.find((component) => component.partClass === 'controller_board' || component.category === 'controller')
      || selected[0]
      || null;
    const peripherals = selected.filter((component) => component.id !== controller?.id);

    const nextNodes = [];
    const nextEdges = [];

    if (controller) {
      nextNodes.push({
        id: controller.id,
        type: 'imageNode',
        position: { x: 120, y: 260 },
        data: { label: controller.name, image: controller.image, componentId: controller.id },
      });
    }

    peripherals.forEach((component, index) => {
      const column = Math.floor(index / 3);
      const row = index % 3;
      nextNodes.push({
        id: component.id,
        type: 'imageNode',
        position: { x: 520 + column * 320, y: 120 + row * 240 },
        data: { label: component.name, image: component.image, componentId: component.id },
      });
    });

    const nodeIds = new Set(nextNodes.map((n) => n.id));
    const edgeKeySet = new Set();

    const addEdgeIfMissing = (source, target, label) => {
      if (!source || !target) return;
      if (!nodeIds.has(source) || !nodeIds.has(target)) return;
      const key = `${source}::${target}`;
      if (edgeKeySet.has(key)) return;
      edgeKeySet.add(key);
      nextEdges.push({
        id: `${source}-${target}-${generateId()}`,
        source,
        target,
        animated: true,
        label: label || '',
        style: { stroke: 'rgba(37, 99, 235, 0.9)' },
      });
    };

    const planned = Array.isArray(connections) ? connections : [];
    for (const item of planned) {
      const sourceId = item?.sourceId || item?.from || item?.source;
      const targetId = item?.targetId || item?.to || item?.target;
      const label = item?.signalName || item?.label || '';
      addEdgeIfMissing(sourceId, targetId, label);
    }

    if (controller) {
      for (const component of peripherals) {
        addEdgeIfMissing(controller.id, component.id, '');
      }
    }

    set((state) => ({
      flowNodes: nextNodes,
      flowEdges: nextEdges,
      scene: createEmptyScene(),
      sceneVersion: state.sceneVersion + 1,
      selectedNodeId: controller?.id ?? nextNodes[0]?.id ?? null,
      lastComponentIds: selected.map((component) => component.id),
    }));
  },
}));
