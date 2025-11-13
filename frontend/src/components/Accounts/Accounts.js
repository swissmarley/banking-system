import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Accounts.css';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ account_type: 'checking' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/accounts');
      setAccounts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await axios.post('/api/accounts', formData);
      setAccounts([...accounts, response.data]);
      setSuccess('Account created successfully!');
      setShowForm(false);
      setFormData({ account_type: 'checking' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      await axios.delete(`/api/accounts/${id}`);
      setAccounts(accounts.filter(acc => acc.id !== id));
      setSuccess('Account deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
    }
  };

  if (loading) {
    return <div className="loading">Loading accounts...</div>;
  }

  return (
    <div className="accounts-page">
      <div className="page-header">
        <h1>My Accounts</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Create New Account'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="form-card">
          <h2>Create New Account</h2>
          <form onSubmit={handleCreateAccount}>
            <div className="form-group">
              <label htmlFor="account_type">Account Type</label>
              <select
                id="account_type"
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                required
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="business">Business</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Create Account
            </button>
          </form>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="empty-state">
          <p>No accounts yet. Create your first account above.</p>
        </div>
      ) : (
        <div className="accounts-list">
          {accounts.map((account) => (
            <div key={account.id} className="account-item">
              <div className="account-info">
                <h3>{account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account</h3>
                <p className="account-number">Account: {account.account_number}</p>
                <p className="account-balance">Balance: ${parseFloat(account.balance).toFixed(2)}</p>
                <p className="account-date">
                  Created: {new Date(account.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="account-actions">
                <button
                  onClick={() => handleDeleteAccount(account.id)}
                  className="btn-danger"
                  disabled={parseFloat(account.balance) > 0}
                  title={parseFloat(account.balance) > 0 ? 'Cannot delete account with balance' : 'Delete account'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Accounts;


