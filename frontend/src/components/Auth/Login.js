import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login, user, authError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (authError) {
      setStatus({ type: 'error', message: authError });
    }
  }, [authError]);

  const handleChange = ({ target }) => {
    setForm((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);

    const result = await login(form.email, form.password);
    setSubmitting(false);

    if (result.success) {
      setStatus({ type: 'success', message: 'Welcome back! Redirecting to your dashboard.' });
      navigate('/dashboard');
    } else {
      setStatus({
        type: 'error',
        message: result.error || 'Unable to login with those credentials.'
      });
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel__intro">
          <p className="eyebrow">Secure banking suite</p>
          <h1>
            Sign in with <span>JWT protection</span>
          </h1>
          <p className="subtitle">
            Use your email and password to retrieve a fresh token and unlock the complete banking
            workspace — no extra factors required.
          </p>
          <ul className="auth-highlights">
            <li>Realtime balances & transfers</li>
            <li>Biometric-grade encryption at rest</li>
            <li>Granular audit trail for every movement</li>
          </ul>
        </div>

        <div className="auth-panel__form">
          <div className="auth-card">
            <h2>Welcome back</h2>
            {status?.message && (
              <div className={`auth-banner ${status.type}`}>{status.message}</div>
            )}
            <form onSubmit={handleSubmit} className="auth-form">
              <label className="floating-label">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="you@email.com"
                  required
                  disabled={submitting}
                />
              </label>
              <label className="floating-label">
                <span>Password</span>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Authenticating…' : 'Login & get JWT'}
              </button>
            </form>

            <p className="auth-link">
              Need an account? <Link to="/register">Create one in seconds</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
