import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BsEnvelope } from 'react-icons/bs';
import { motion } from 'framer-motion';
import lspuBg from '../../../assets/lspu-bg.png';
import ccsLogo from '../../../assets/ccs-logo.png';
import lspuLogo from '../../../assets/lspu-logo.png';
import authApi from '../../../services/authApi';
import '../styles/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.requestPasswordReset(email.trim());
      setMessage(data?.message || 'Check your email for instructions.');
    } catch (err) {
      // Keep messaging generic to match backend anti-enumeration behavior.
      setMessage('Check your email for instructions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="login-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ '--login-bg-image': `url(${lspuBg})` }}
    >
      <section
        className="login-visual-side"
        style={{ backgroundImage: `url(${lspuBg})` }}
        aria-hidden="true"
      >
        <div className="visual-overlay" />
      </section>

      <section className="login-form-side">
        <motion.div
          className="login-card"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="logo-row">
            <img src={lspuLogo} alt="LSPU logo" className="institution-logo" />
            <img src={ccsLogo} alt="CCS logo" className="institution-logo" />
          </div>

          <header className="login-header">
            <h1 className="login-title">Forgot Password</h1>
            <p className="login-subtitle">Enter your email to receive reset instructions.</p>
          </header>

          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          {message && (
            <div className="alert" role="status">{message}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-with-icon">
                <BsEnvelope className="input-icon" aria-hidden="true" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="btn-wrapper">
              <motion.button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </div>
          </form>

          <footer className="auth-footer">
            <p>
              Remembered your password?{' '}
              <Link to="/login" className="auth-link">Back to login</Link>
            </p>
          </footer>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default ForgotPassword;
