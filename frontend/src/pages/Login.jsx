import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      // Save token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLogin(data.user);
      navigate('/admin'); // redirect to admin dashboard
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server.');
    }
  };

  const handleDemoClick = (demoEmail) => {
    setEmail(demoEmail);
    setPassword(''); // Auto-fill only the email, force user to type password
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-logo-icon">RP</div>
        <h1>RestroPOS</h1>
        <p>Restaurant Management System</p>
      </div>

      <div className="login-card">
        <div className="login-card-header">
          <h2>Sign in</h2>
          <p>Enter your credentials to access the dashboard</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Email address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@restpos.com"
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required 
            />
          </div>

          <button type="submit" className="login-submit-btn">
            Sign in →
          </button>
        </form>

        <div className="demo-accounts">
          <div className="demo-title">DEMO ACCOUNTS</div>
          <div className="demo-list">
            <div className="demo-item" onClick={() => handleDemoClick('admin@restpos.com')}>
              <span>Owner/Admin</span>
              <span className="demo-email">admin@restpos.com</span>
            </div>
            <div className="demo-item" onClick={() => handleDemoClick('manager@restpos.com')}>
              <span>Manager</span>
              <span className="demo-email">manager@restpos.com</span>
            </div>
            <div className="demo-item" onClick={() => handleDemoClick('cashier@restpos.com')}>
              <span>Cashier</span>
              <span className="demo-email">cashier@restpos.com</span>
            </div>
            <div className="demo-item" onClick={() => handleDemoClick('waiter@restpos.com')}>
              <span>Waiter/Server</span>
              <span className="demo-email">waiter@restpos.com</span>
            </div>
            <div className="demo-item" onClick={() => handleDemoClick('kitchen@restpos.com')}>
              <span>Kitchen Staff</span>
              <span className="demo-email">kitchen@restpos.com</span>
            </div>
            <div className="demo-item" onClick={() => handleDemoClick('inventory@restpos.com')}>
              <span>Inventory Manager</span>
              <span className="demo-email">inventory@restpos.com</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit' }}
        >
          ← Back to Customer Portal
        </button>
      </div>
    </div>
  );
}
