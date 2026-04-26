import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Type, Palette, Layers, Check, Trash2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_COLORS = [
  '#ffffff', '#e2e8f0', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#fca5a5', '#f87171', '#ef4444',
  '#fdba74', '#fb923c', '#f97316', '#fcd34d', '#fbbf24', '#f59e0b', '#bef264', '#a3e635', '#84cc16', '#86efac', 
  '#4ade80', '#22c55e', '#67e8f9', '#22d3ee', '#06b6d4', '#7dd3fc', '#38bdf8', '#0ea5e9', '#a5b4fc', '#818cf8', 
  '#6366f1', '#f9a8d4', '#f472b6', '#ec4899', '#c084fc', '#a855f7', '#9333ea'
];

export default function PropertiesModal({ nodeId, onClose }) {
  const flowNodes = useStore((state) => state.flowNodes);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const removeNode = useStore((state) => state.removeNode);
  
  const node = flowNodes.find(n => n.id === nodeId);
  
  const [label, setLabel] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (node) {
      setLabel(node.data.label || '');
      setFontSize(node.data.fontSize || 12);
      setColor(node.data.color || '#ffffff');
      setOpacity(node.data.opacity || 1);
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    updateNodeData(nodeId, { label, fontSize, color, opacity });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Delete this component?')) {
      removeNode(nodeId);
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="properties-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="properties-card"
        onClick={e => e.stopPropagation()}
      >
        <header className="properties-header">
           <div className="header-title">
             <Palette size={18} />
             <span>Shape Properties</span>
           </div>
           <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="properties-body">
           <div className="property-group">
             <label><Tag size={14} /> <span>LABEL:</span></label>
             <input 
               type="text" 
               value={label} 
               onChange={e => setLabel(e.target.value)}
               placeholder="Enter label..."
             />
           </div>

           <div className="property-group">
             <label><Type size={14} /> <span>TEXT SIZE: {fontSize}PX</span></label>
             <input 
               type="range" 
               min="8" max="40" 
               value={fontSize} 
               onChange={e => setFontSize(parseInt(e.target.value))}
             />
             <div className="range-hints"><span>8px</span><span>40px</span></div>
           </div>

           <div className="property-group">
             <label><Palette size={14} /> <span>COLOR:</span></label>
             <div className="color-preview-row">
                <div className="color-box" style={{ background: color }} />
                <input className="color-input" type="text" value={color.toUpperCase()} readOnly />
             </div>
             <div className="color-grid">
                {PRESET_COLORS.map(c => (
                  <button 
                    key={c} 
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  >
                    {color === c && <Check size={10} stroke={c === '#ffffff' ? '#000' : '#fff'} />}
                  </button>
                ))}
             </div>
           </div>

           <div className="property-group">
             <label><Layers size={14} /> <span>OPACITY: {Math.round(opacity * 100)}%</span></label>
             <input 
               type="range" 
               min="0.1" max="1" step="0.05"
               value={opacity} 
               onChange={e => setOpacity(parseFloat(e.target.value))}
             />
           </div>
        </div>

        <footer className="properties-footer">
           <button className="save-btn" onClick={handleSave}>
             <Check size={16} />
             <span>Save Changes</span>
           </button>
           <button className="delete-node-btn" onClick={handleDelete}>
             <Trash2 size={16} />
             <span>Delete</span>
           </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
