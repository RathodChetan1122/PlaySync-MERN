import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('All fields are required');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <h1 className="auth-headline">Play Together,<br /><span>Win Together</span></h1>
          <p className="auth-tagline">Real-time multiplayer gaming with friends. Create rooms, chat live, and compete in 4 exciting games.</p>
          <div className="auth-features">
            {[
              { icon: '⚡', text: 'Live multiplayer with Socket.IO' },
              { icon: '🎮', text: 'Tic Tac Toe, Chess, RPS & Word Scramble' },
              { icon: '💬', text: 'Real-time chat in every room' },
              { icon: '🏆', text: 'Global leaderboard & player stats' },
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
          <h2 className="auth-box-title">Sign in</h2>
          <p className="auth-box-sub">Enter your credentials to continue</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="input" type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" type="password" name="password" placeholder="••••••••"
                value={form.password} onChange={handleChange} />
            </div>
            <button className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="loader" style={{width:16,height:16,borderWidth:2}} /> Signing in...</> : 'Sign in →'}
            </button>
          </form>
          <p className="auth-switch">
            New to PlaySync? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}