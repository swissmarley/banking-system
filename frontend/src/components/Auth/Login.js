import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TwoFactorChallenge from './TwoFactorChallenge';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, twoFactorState, user, cancelTwoFactorFlow } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && twoFactorState.status === 'idle') {
      navigate('/dashboard');
    }
  }, [user, twoFactorState.status, navigate]);

  const twoFactorActive = useMemo(
    () => twoFactorState.status !== 'idle',
    [twoFactorState.status]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setPassword('');
    }
  };

  const handleCancelTwoFactor = async () => {
    await cancelTwoFactorFlow();
    setPassword('');
    setError('');
  };

  const cardClasses = `auth-card${twoFactorActive ? ' two-factor-active' : ''}`;

  return (
    <div className="auth-container">
      <div className={cardClasses}>
        {twoFactorActive ? (
          <TwoFactorChallenge onCancel={handleCancelTwoFactor} />
        ) : (
          <>
            <h2>Login</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <div className="form-group-inline">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  <label htmlFor="showPassword">Show password</label>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p className="auth-link">
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
