import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TwoFactorChallenge from './TwoFactorChallenge';
import './Auth.css';

const passwordRequirements = [
  {
    id: 'length',
    label: 'At least 8 characters',
    message: 'Password must be at least 8 characters long',
    test: (value) => value.length >= 8
  },
  {
    id: 'uppercase',
    label: 'Contains an uppercase letter',
    message: 'Password must contain at least one uppercase letter',
    test: (value) => /[A-Z]/.test(value)
  },
  {
    id: 'lowercase',
    label: 'Contains a lowercase letter',
    message: 'Password must contain at least one lowercase letter',
    test: (value) => /[a-z]/.test(value)
  },
  {
    id: 'digit',
    label: 'Contains a number',
    message: 'Password must contain at least one digit',
    test: (value) => /[0-9]/.test(value)
  },
  {
    id: 'special',
    label: 'Contains a special character',
    message: 'Password must contain at least one special character',
    test: (value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
  }
];

const RequirementIcon = ({ passed }) => (
  <svg
    className={`password-checker-icon ${passed ? 'pass' : 'fail'}`}
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    {passed ? (
      <path
        d="M3 8.5l3 3L13 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <>
        <path
          d="M4 4l8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 4l-8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    )}
  </svg>
);

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, twoFactorState, user, cancelTwoFactorFlow } = useAuth();
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

  const requirementStatuses = useMemo(
    () =>
      passwordRequirements.map((requirement) => ({
        ...requirement,
        satisfied: requirement.test(password)
      })),
    [password]
  );

  const validatePassword = (value) => {
    const failingRequirement = passwordRequirements.find(
      (requirement) => !requirement.test(value)
    );
    return failingRequirement ? failingRequirement.message : null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    const result = await register(username, email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setPassword('');
    }
  };

  const handleCancelTwoFactor = () => {
    cancelTwoFactorFlow();
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
            <h2>Create account</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  minLength={3}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
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
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
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
                <div className="password-checker" aria-live="polite">
                  {requirementStatuses.map((requirement) => (
                    <div
                      key={requirement.id}
                      className={`password-checker-item ${
                        requirement.satisfied ? 'pass' : 'fail'
                      }`}
                    >
                      <RequirementIcon passed={requirement.satisfied} />
                      <span>{requirement.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
            <p className="auth-link">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
