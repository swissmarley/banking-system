import React, { useState, useEffect } from 'react';
import apiClient from '../../lib/apiClient';
import { useNavigate } from 'react-router-dom';
import './TransactionForm.css';

const TransactionForm = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    type: 'deposit',
    account_id: '',
    from_account_id: '',
    to_account_id: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/api/accounts');
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to load accounts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);

      if (formData.type === 'deposit') {
        await apiClient.post('/api/transactions/deposit', {
          account_id: parseInt(formData.account_id),
          amount
        });
      } else if (formData.type === 'withdrawal') {
        await apiClient.post('/api/transactions/withdraw', {
          account_id: parseInt(formData.account_id),
          amount
        });
      } else if (formData.type === 'transfer') {
        await apiClient.post('/api/transactions/transfer', {
          from_account_id: parseInt(formData.from_account_id),
          to_account_id: parseInt(formData.to_account_id),
          amount
        });
      }

      setSuccess(`${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} successful!`);
      setFormData({
        type: 'deposit',
        account_id: '',
        from_account_id: '',
        to_account_id: '',
        amount: ''
      });
      
      setTimeout(() => {
        navigate('/transactions');
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.errors?.[0]?.msg || 
                          err.message || 
                          `Failed to process ${formData.type}`;
      setError(errorMessage);
      console.error('Transaction error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e) => {
    setFormData({
      ...formData,
      type: e.target.value,
      account_id: '',
      from_account_id: '',
      to_account_id: ''
    });
  };

  return (
    <div className="transaction-form-page">
      <h1>New Transaction</h1>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="type">Transaction Type</label>
            <select
              id="type"
              value={formData.type}
              onChange={handleTypeChange}
              required
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {formData.type === 'deposit' && (
            <div className="form-group">
              <label htmlFor="account_id">To Account</label>
              <select
                id="account_id"
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                required
              >
                <option value="">Select account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_number} - ${parseFloat(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'withdrawal' && (
            <div className="form-group">
              <label htmlFor="account_id">From Account</label>
              <select
                id="account_id"
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                required
              >
                <option value="">Select account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_number} - ${parseFloat(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'transfer' && (
            <>
              <div className="form-group">
                <label htmlFor="from_account_id">From Account</label>
                <select
                  id="from_account_id"
                  value={formData.from_account_id}
                  onChange={(e) => setFormData({ ...formData, from_account_id: e.target.value })}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - ${parseFloat(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="to_account_id">To Account</label>
                <select
                  id="to_account_id"
                  value={formData.to_account_id}
                  onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
                  required
                >
                  <option value="">Select account</option>
                  {accounts
                    .filter(acc => acc.id !== parseInt(formData.from_account_id))
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number} - ${parseFloat(acc.balance).toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : `Process ${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;

