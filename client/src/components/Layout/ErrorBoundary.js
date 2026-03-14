import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('PlaySync Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center',
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          <span style={{ fontSize: 64 }}>💥</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent-red)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, fontSize: 14 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
          >
            🏠 Back to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
