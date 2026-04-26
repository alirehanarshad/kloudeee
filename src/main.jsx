import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store/useStore';

window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled rejection:', event.reason);
  try {
    useStore.getState().pushToast(`Error: ${event.reason?.message || String(event.reason || 'Unknown')}`, 'error');
  } catch {
    // ignore
  }
});

window.addEventListener('error', (event) => {
  // eslint-disable-next-line no-console
  console.error('Window error:', event.error || event.message);
  try {
    useStore.getState().pushToast(`Error: ${event.error?.message || event.message || 'Unknown'}`, 'error');
  } catch {
    // ignore
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
