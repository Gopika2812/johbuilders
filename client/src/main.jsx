import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'sans-serif',
          background: '#f8fafc',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            maxWidth: '480px',
            width: '100%'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0e623a', marginBottom: '8px' }}>
              John Builders ERP
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Something went wrong loading this view. Please refresh or click the button below to reload.
            </p>
            <button
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (const r of registrations) r.unregister();
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(names => {
                    for (const n of names) caches.delete(n);
                  });
                }
                sessionStorage.clear();
                window.location.reload(true);
              }}
              style={{
                background: '#0e623a',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Clear stale service workers and old cache to force fresh assets
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const r of registrations) {
      r.unregister();
    }
  }).catch(() => {});
}
if ('caches' in window) {
  caches.keys().then(names => {
    for (const n of names) {
      caches.delete(n);
    }
  }).catch(() => {});
}
