import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return toast.error('All fields required');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password min 6 characters');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Welcome to PlaySync!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">🎮</div>
            <span className="auth-brand-name">PlaySync</span>
          </div>
          <h1 className="auth-headline">Join the<br /><span>Gaming Arena</span></h1>
          <p className="auth-tagline">Create your account and start playing with friends in seconds. No downloads needed.</p>
          <div className="auth-features">
            {[
              { icon: '🚀', text: 'Free to play, forever' },
              { icon: '👥', text: 'Play with up to 8 players per room' },
              { icon: '📊', text: 'Track your wins and rankings' },
              { icon: '🔒', text: 'Private rooms with password protection' },
            ].map(f => (
              <div key={f.text} className="auth-feature">
                <div className="auth-feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-box animate-fadeIn">
          <h2 className="auth-box-title">Create account</h2>
          <p className="auth-box-sub">Join thousands of players on PlaySync</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="input" name="username" placeholder="Your display name"
                value={form.username} onChange={handleChange} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="input" type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" type="password" name="password" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input className="input" type="password" name="confirm" placeholder="Repeat password"
                value={form.confirm} onChange={handleChange} />
            </div>
            <button className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="loader" style={{width:16,height:16,borderWidth:2}} /> Creating...</> : 'Create account →'}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}