import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center',
    }}>
      <span style={{ fontSize: 80 }}>👾</span>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--accent-primary)' }}>404</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>This page doesn't exist in the PlaySync universe.</p>
      <Link to="/dashboard" className="btn btn-primary btn-lg">🏠 Go Home</Link>
    </div>
  );
}
