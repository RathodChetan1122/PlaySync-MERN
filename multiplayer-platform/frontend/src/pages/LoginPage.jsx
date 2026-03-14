import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!form.password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🎮</span>
          <h2 style={styles.title}>GameChat</h2>
        </div>
        <p style={styles.subtitle}>Login to your account</p>

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
          autoComplete="off"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={styles.input}
          autoComplete="new-password"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p style={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.switchLink}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', background: '#1e1e2e',
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: '14px',
    width: '380px', padding: '40px', borderRadius: '16px',
    background: '#2e2e3e', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  logoIcon: { fontSize: '32px' },
  title: { color: '#cdd6f4', margin: 0, fontSize: '28px' },
  subtitle: { color: '#a6adc8', margin: 0, textAlign: 'center', fontSize: '14px' },
  errorBox: {
    background: '#f38ba820', border: '1px solid #f38ba8',
    color: '#f38ba8', padding: '10px 14px', borderRadius: '8px',
    fontSize: '13px', textAlign: 'center',
  },
  input: {
    padding: '12px', borderRadius: '8px', border: '1px solid #45475a',
    background: '#1e1e2e', color: '#cdd6f4', fontSize: '14px', outline: 'none',
  },
  button: {
    padding: '13px', background: '#6366f1', color: '#fff',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 700, fontSize: '15px',
  },
  switchText: { color: '#a6adc8', textAlign: 'center', fontSize: '13px', margin: 0 },
  switchLink: { color: '#6366f1', fontWeight: 600, textDecoration: 'none' },
};