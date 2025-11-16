import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const passwordRequirements = [
  { id: 'length', label: 'Min. 8 characters', test: (value) => value.length >= 8 },
  { id: 'uppercase', label: 'Include uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { id: 'lowercase', label: 'Include lowercase letter', test: (value) => /[a-z]/.test(value) },
  { id: 'digit', label: 'Include a digit', test: (value) => /[0-9]/.test(value) },
  {
    id: 'special',
    label: 'Include special character',
    test: (value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
  }
];

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [status, setStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, user, authError } = useAuth();
  const navigate = useNavigate();

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

  const requirementStatuses = useMemo(
    () =>
      passwordRequirements.map((requirement) => ({
        ...requirement,
        satisfied: requirement.test(form.password)
      })),
    [form.password]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const hasError = requirementStatuses.some((req) => !req.satisfied);
    if (hasError) {
      setStatus({ type: 'error', message: 'Please meet all password requirements.' });
      return;
    }

    setSubmitting(true);
    const result = await register(form.username, form.email, form.password);
    setSubmitting(false);

    if (result.success) {
      setStatus({ type: 'success', message: 'Account created! Redirecting…' });
      navigate('/dashboard');
    } else {
      setStatus({
        type: 'error',
        message: result.error || 'Unable to register with those details.'
      });
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel__intro">
          <p className="eyebrow">Modern finance OS</p>
          <h1>
            Create a <span>JWT-powered</span> profile
          </h1>
          <p className="subtitle">
            Provision a digital bank account, issue IBANs instantly, and manage transfers through a
            single secure workspace.
          </p>
          <ul className="auth-highlights">
            <li>Unlimited accounts per organization</li>
            <li>Enterprise-grade access policies</li>
            <li>Live transaction intelligence dashboard</li>
          </ul>
        </div>

        <div className="auth-panel__form">
          <div className="auth-card">
            <h2>Create account</h2>
            {status?.message && (
              <div className={`auth-banner ${status.type}`}>{status.message}</div>
            )}
            <form onSubmit={handleSubmit} className="auth-form">
              <label className="floating-label">
                <span>Username</span>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="jane.doe"
                  required
                  minLength={3}
                  disabled={submitting}
                />
              </label>
              <label className="floating-label">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
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
                    placeholder="••••••••"
                    required
                    minLength={8}
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
              <div className="password-meter">
                {requirementStatuses.map((req) => (
                  <span
                    key={req.id}
                    className={`password-pill ${req.satisfied ? 'pass' : 'fail'}`}
                  >
                    {req.label}
                  </span>
                ))}
              </div>

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creating profile…' : 'Register & issue token'}
              </button>
            </form>
            <p className="auth-link">
              Already registered? <Link to="/login">Back to login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
