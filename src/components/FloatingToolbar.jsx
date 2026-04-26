import { useStore } from '../store/useStore';
import { Copy, Scissors, Clipboard, Square, RotateCcw, RotateCw, Download, Maximize, Trash2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingToolbar() {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const duplicateNode = useStore((state) => state.duplicateNode);
  const removeNode = useStore((state) => state.removeNode);
  const clearCanvas = useStore((state) => state.clearCanvas);
  const flowNodes = useStore((state) => state.flowNodes);
  const flowEdges = useStore((state) => state.flowEdges);

  const handleCopy = () => {
    if (selectedNodeId) duplicateNode(selectedNodeId);
  };

  const handleDelete = () => {
    if (selectedNodeId) removeNode(selectedNodeId);
  };

  const handleDownload = () => {
    const payload = JSON.stringify({ nodes: flowNodes, edges: flowEdges }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infrastructure-diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="canvas-floating-toolbar"
    >
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Copy" onClick={handleCopy} disabled={!selectedNodeId}><Copy size={16} /></button>
        <button className="toolbar-btn" title="Cut" disabled={!selectedNodeId}><Scissors size={16} /></button>
        <button className="toolbar-btn" title="Paste"><Clipboard size={16} /></button>
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Undo"><RotateCcw size={16} /></button>
        <button className="toolbar-btn" title="Redo"><RotateCw size={16} /></button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className="toolbar-btn" title="Move to Front" disabled={!selectedNodeId}><Layers size={16} /></button>
        <button className="toolbar-btn" title="Delete" onClick={handleDelete} disabled={!selectedNodeId}><Trash2 size={16} /></button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className="toolbar-btn" title="Download" onClick={handleDownload}><Download size={16} /></button>
        <button className="toolbar-btn" title="Fullscreen"><Maximize size={16} /></button>
      </div>
    </motion.div>
  );
}
