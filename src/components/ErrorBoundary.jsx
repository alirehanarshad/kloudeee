import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error) {
    // Keep console output for debugging
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Kloude crashed</h2>
          <p style={{ color: '#475569', marginTop: 8 }}>
            {this.state.message || 'Unknown error.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              border: 0,
              borderRadius: 999,
              padding: '10px 16px',
              background: '#111827',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

