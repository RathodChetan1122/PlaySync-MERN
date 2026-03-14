import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
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
        <p style={styles.subtitle}>Create your account</p>
        <input
          name="username" type="text" placeholder="Username"
          value={form.username} onChange={handleChange}
          style={styles.input} required autoComplete="off"
        />
        <input
          name="email" type="email" placeholder="Email"
          value={form.email} onChange={handleChange}
          style={styles.input} required autoComplete="off"
        />
        <input
          name="password" type="password" placeholder="Password"
          value={form.password} onChange={handleChange}
          style={styles.input} required autoComplete="new-password"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.switchLink}>Login</Link>
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