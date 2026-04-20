import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImg from '../assets/restaurant_hero.png';
import patternImg from '../assets/food_pattern.png';

export default function CustomerSignup({ onCustomerLogin }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !contact.trim()) {
      setError('Please enter your name and email/phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      onCustomerLogin(data.customer);
      navigate('/customer/menu');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cust-signup-page">
      {/* Background pattern */}
      <div className="cust-bg-pattern" style={{ backgroundImage: `url(${patternImg})` }} />

      {/* Left: Hero Image Section */}
      <div className="cust-hero-section">
        <img src={heroImg} alt="Restaurant" className="cust-hero-img" />
        <div className="cust-hero-overlay">
          <div className="cust-hero-content">
            <div className="cust-hero-badge">Welcome to</div>
            <h1 className="cust-hero-title">Grand Spice Kitchen</h1>
            <p className="cust-hero-sub">Authentic Indian Cuisine</p>
            <div className="cust-hero-features">
              <div className="cust-hero-feat">Order from your table</div>
              <div className="cust-feat-divider" />
              <div className="cust-hero-feat">Quick & easy ordering</div>
              <div className="cust-feat-divider" />
              <div className="cust-hero-feat">Fresh kitchen-prepared meals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Sign-Up Form */}
      <div className="cust-form-section">
        <div className="cust-form-wrapper">
          <div className="cust-form-header">
            <h2 className="cust-form-title">Get Started</h2>
            <p className="cust-form-subtitle">Enter your details to browse our menu and place your order</p>
          </div>

          {error && (
            <div className="cust-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="cust-form">
            <div className="cust-input-group">
              <label>Your Name</label>
              <div className="cust-input-wrap">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            <div className="cust-input-group">
              <label>Email or Phone Number</label>
              <div className="cust-input-wrap">
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="email@example.com or 9876543210"
                  required
                />
              </div>
            </div>

            <button type="submit" className="cust-submit-btn" disabled={loading}>
              {loading ? (
                <span className="cust-btn-loading">
                  <span className="cust-spinner" /> Signing in...
                </span>
              ) : (
                <>Browse Menu & Order</>
              )}
            </button>
          </form>

          <div className="cust-form-footer">
            <p>By continuing, you agree to receive order updates</p>
          </div>

          {/* Staff login link */}
          <button 
            className="cust-staff-link"
            onClick={() => navigate('/login')}
          >
            Staff Login →
          </button>
        </div>
      </div>
    </div>
  );
}
