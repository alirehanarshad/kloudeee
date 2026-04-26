import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { FilePlus, FolderOpen, Save, FileDown, ChevronDown } from 'lucide-react';

export default function TopMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const clearCanvas = useStore((state) => state.clearCanvas);
  const flowNodes = useStore((state) => state.flowNodes);
  const flowEdges = useStore((state) => state.flowEdges);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNew = () => {
    if (confirm('Are you sure you want to start a new diagram? All unsaved changes will be lost.')) {
      clearCanvas();
      setIsOpen(false);
    }
  };

  const handleSave = () => {
    const payload = JSON.stringify({ nodes: flowNodes, edges: flowEdges }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kloude-arch-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const { nodes, edges } = JSON.parse(re.target.result);
          useStore.setState({ flowNodes: nodes || [], flowEdges: edges || [] });
        } catch (err) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setIsOpen(false);
  };

  return (
    <div className="top-menu-container" ref={menuRef}>
      <button className={`menu-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span>File</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
           <button className="menu-item" onClick={handleNew}>
             <div className="menu-item-left">
               <FilePlus size={16} />
               <span>New Diagram</span>
             </div>
             <span className="shortcut">Ctrl+N</span>
           </button>
           <button className="menu-item" onClick={handleOpen}>
             <div className="menu-item-left">
               <FolderOpen size={16} />
               <span>Open Diagram</span>
             </div>
             <span className="shortcut">Ctrl+O</span>
           </button>
           <div className="menu-divider" />
           <button className="menu-item" onClick={handleSave}>
             <div className="menu-item-left">
               <Save size={16} />
               <span>Save Diagram</span>
             </div>
             <span className="shortcut">Ctrl+S</span>
           </button>
           <button className="menu-item" onClick={handleSave}>
             <div className="menu-item-left">
               <FileDown size={16} />
               <span>Save Diagram As</span>
             </div>
             <span className="shortcut">Ctrl+Shift+S</span>
           </button>
        </div>
      )}
      
      <div className="menu-static-actions">
        <button className="menu-trigger static">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/></svg>
          <span>Convert</span>
        </button>
      </div>
    </div>
  );
}
