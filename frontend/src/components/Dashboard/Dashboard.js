import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsRes, transactionsRes] = await Promise.all([
        axios.get('/api/accounts'),
        axios.get('/api/transactions?limit=10')
      ]);
      setAccounts(accountsRes.data);
      setTransactions(transactionsRes.data.transactions || []);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Balance</h3>
          <p className="balance-amount">${totalBalance.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Accounts</h3>
          <p className="balance-amount">{accounts.length}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Your Accounts</h2>
        {accounts.length === 0 ? (
          <p className="empty-state">No accounts yet. Create one from the Accounts page.</p>
        ) : (
          <div className="accounts-grid">
            {accounts.map((account) => (
              <div key={account.id} className="account-card">
              <h4>{account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}</h4>
              <p className="account-number">{account.account_number}</p>
              <p className="account-balance">${parseFloat(account.balance).toFixed(2)}</p>
            </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="empty-state">No transactions yet.</p>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <span className={`transaction-type ${transaction.type}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td>${parseFloat(transaction.amount).toFixed(2)}</td>
                    <td>{transaction.from_account_number || 'N/A'}</td>
                    <td>{transaction.to_account_number || 'N/A'}</td>
                    <td>{new Date(transaction.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;




