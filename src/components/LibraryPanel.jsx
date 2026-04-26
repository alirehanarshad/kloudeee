import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { processImage, generateId } from '../lib/sceneUtils';
import { ChevronDown, ChevronUp, Search, Info } from 'lucide-react';

const GENERAL_COMPONENTS = [
  { id: 'gen-rect', name: 'Rectangle', provider: 'general', category: 'shape', image: 'https://img.icons8.com/color/48/rectangle.png' },
  { id: 'gen-circle', name: 'Circle', provider: 'general', category: 'shape', image: 'https://img.icons8.com/color/48/circle.png' },
  { id: 'gen-cyl', name: 'Cylinder', provider: 'general', category: 'shape', image: 'https://img.icons8.com/color/48/database.png' },
  { id: 'gen-tri', name: 'Triangle', provider: 'general', category: 'shape', image: 'https://img.icons8.com/color/48/triangle.png' },
  { id: 'gen-text', name: 'TextBox', provider: 'general', category: 'shape', image: 'https://img.icons8.com/color/48/text-width.png' },
];

export default function LibraryPanel() {
  const [activeTab, setActiveTab] = useState('cloud');
  const [search, setSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    aws: true,
    azure: true,
    gcp: true,
    custom: true
  });

  const componentsCatalog = useStore((state) => state.componentsCatalog);
  const customComponents = useStore((state) => state.customComponents);
  const addNodeFromComponent = useStore((state) => state.addNodeFromComponent);
  const addGenericImage = useStore((state) => state.addGenericImage);
  const removeFromCustomLibrary = useStore((state) => state.removeFromCustomLibrary);
  const selectedProvider = useStore((state) => state.selectedProvider);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredCatalog = useMemo(() => {
    const needle = search.toLowerCase();
    const all = [...GENERAL_COMPONENTS, ...componentsCatalog];
    return all.filter((item) => 
      item.name?.toLowerCase().includes(needle) || 
      item.id?.toLowerCase().includes(needle)
    );
  }, [componentsCatalog, search]);

  const sections = useMemo(() => {
    return {
      general: filteredCatalog.filter(item => item.provider === 'general'),
      aws: filteredCatalog.filter(item => item.provider === 'aws'),
      azure: filteredCatalog.filter(item => item.provider === 'azure'),
      gcp: filteredCatalog.filter(item => item.provider === 'gcp'),
      custom: customComponents.filter(item => 
        item.name?.toLowerCase().includes(search.toLowerCase())
      )
    };
  }, [filteredCatalog, customComponents, search]);

  const renderSection = (id, title, items, color) => {
    if (items.length === 0 && search) return null;
    const isExpanded = expandedSections[id];
    
    return (
      <div key={id} className={`library-section ${id}`}>
        <button 
          className="section-header" 
          onClick={() => toggleSection(id)}
          style={{ background: color }}
        >
          <div className="section-title">
             {id === 'aws' && <img src="/AWS-logo.png" style={{width: 16}} alt="" />}
             {id === 'azure' && <img src="/Azure-Logo.png" style={{width: 16}} alt="" />}
             {id === 'gcp' && <img src="/GCP-logo.png" style={{width: 16}} alt="" />}
             <span>{title}</span>
          </div>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {isExpanded && (
          <div className="section-grid">
            {items.map((item) => (
              <button 
                key={item.id} 
                className="library-item" 
                type="button" 
                onClick={() => addNodeFromComponent(item.id)}
              >
                <div className="item-thumb">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <span className="item-label">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="library-panel">
      <div className="library-search-container">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="library-info-box">
        <Info size={14} />
        <p>Search over 1000+ icons. Note that these icons will not have any mapping when you convert diagram.</p>
      </div>

      <div className="library-scroll-area">
        {renderSection('general', 'General Components', sections.general, '#0ea5e9')}
        
        {/* Dynamic Provider Isolation */}
        {selectedProvider === 'aws' && renderSection('aws', 'AWS Icons', sections.aws, '#f97316')}
        {selectedProvider === 'azure' && renderSection('azure', 'Azure Icons', sections.azure, '#2563eb')}
        {selectedProvider === 'gcp' && renderSection('gcp', 'GCP Icons', sections.gcp, '#10b981')}
        
        {customComponents.length > 0 && renderSection('custom', 'Custom Assets', sections.custom, '#6366f1')}
      </div>
    </aside>
  );
}
