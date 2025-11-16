import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          Banking System
        </Link>
        {user && (
          <div className="navbar-menu">
            <Link to="/dashboard" className="navbar-link">
              Dashboard
            </Link>
            <Link to="/accounts" className="navbar-link">
              Accounts
            </Link>
            <Link to="/transactions" className="navbar-link">
              Transactions
            </Link>
            <Link to="/transfer" className="navbar-link">
              Transfer
            </Link>
            <Link to="/payments" className="navbar-link">
              Payments
            </Link>
            <Link to="/bills" className="navbar-link">
              Orders & Bills
            </Link>
            <div className="navbar-user">
              <span>{user.username}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;




