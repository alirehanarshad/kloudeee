import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  NodeResizer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../store/useStore';

import { motion, AnimatePresence } from 'framer-motion';

function ImageNode({ id, data, selected }) {
  const removeNode = useStore((state) => state.removeNode);

  return (
    <div 
      className={`kloude-canvas-node ${selected ? 'selected' : ''}`} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        opacity: data.opacity ?? 1,
        transition: 'opacity 0.2s ease'
      }}
    >
      <NodeResizer 
        color="#42bcf4" 
        isVisible={selected} 
        minWidth={48} 
        minHeight={48} 
        handleStyle={{ width: 8, height: 8, border: '2px solid white', background: '#42bcf4', borderRadius: '50%' }}
      />
      
      <AnimatePresence>
        {selected && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 0, scale: 0.8 }}
            className="node-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              removeNode(id);
            }}
            title="Remove from architecture"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span>Delete</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div 
        className="node-icon-wrapper" 
        style={{ 
          width: '100%', 
          height: '100%', 
          background: data.color || 'transparent',
          borderRadius: 8,
          transition: 'background 0.3s ease'
        }}
      >
        <Handle type="target" position={Position.Left} style={{ background: '#42bcf4', width: 6, height: 6 }} />
        <Handle type="source" position={Position.Right} style={{ background: '#42bcf4', width: 6, height: 6 }} />
        <Handle type="target" position={Position.Top} style={{ background: '#42bcf4', width: 6, height: 6, left: '50%' }} />
        <Handle type="source" position={Position.Bottom} style={{ background: '#42bcf4', width: 6, height: 6, left: '50%' }} />

        {data?.image && (
          <div className="node-image-container" style={{ width: '100%', height: '100%', padding: '15%' }}>
            <img
              src={data.image}
              alt={data?.label || 'Node'}
              className="node-image"
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        )}
      </div>

      <div className="node-label" style={{ fontSize: `${data.fontSize || 11}px` }}>
        {data?.label || 'Untitled'}
      </div>
    </div>
  );
}

export default function Canvas() {
  const flowNodes = useStore((state) => state.flowNodes);
  const flowEdges = useStore((state) => state.flowEdges);
  const setFlowNodes = useStore((state) => state.setFlowNodes);
  const setFlowEdges = useStore((state) => state.setFlowEdges);
  const setCanvasApi = useStore((state) => state.setCanvasApi);

  const nodeTypes = useMemo(() => ({ imageNode: ImageNode }), []);

  const onNodesChange = useCallback(
    (changes) => setFlowNodes(applyNodeChanges(changes, useStore.getState().flowNodes)),
    [setFlowNodes],
  );

  const onEdgesChange = useCallback(
    (changes) => setFlowEdges(applyEdgeChanges(changes, useStore.getState().flowEdges)),
    [setFlowEdges],
  );

  const onConnect = useCallback(
    (params) => setFlowEdges(addEdge({ ...params, animated: true }, useStore.getState().flowEdges)),
    [setFlowEdges],
  );

  useEffect(() => {
    setCanvasApi({
      getGraph: () => ({
        nodes: useStore.getState().flowNodes,
        edges: useStore.getState().flowEdges,
      }),
    });

    return () => setCanvasApi(null);
  }, [setCanvasApi]);

  return (
    <div className="excalidraw-host">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap pannable zoomable />
        <Controls />
        <Background gap={16} size={1} color="rgba(148,163,184,0.55)" />
      </ReactFlow>
    </div>
  );
}
