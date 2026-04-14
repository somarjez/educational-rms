import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { authApi } from '../../services/authApi';
import ccsLogo from '../../assets/images/ccs-logo.png';
import lspuLogo from '../../assets/images/lspu-logo.png';
import bgImage from '../../assets/images/login-bg.png';
import '../../features/auth/styles/Login.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      setMessage(response.message || 'Reset instructions were sent if the account exists.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to process password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="login-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{ '--login-bg-image': `url(${bgImage})` }}
    >
      <section className="login-visual-side" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true">
        <div className="visual-overlay" />
      </section>

      <section className="login-form-side">
        <motion.div className="login-card" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <div className="logo-row">
            <img src={lspuLogo} alt="LSPU logo" className="institution-logo" />
            <img src={ccsLogo} alt="CCS logo" className="institution-logo" />
          </div>

          <header className="login-header">
            <h1 className="login-title">Forgot Password</h1>
            <p className="login-subtitle">Enter your email address and we will send a reset link.</p>
          </header>

          {message && <div className="alert alert-success" role="status">{message}</div>}
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" aria-hidden="true" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="btn-wrapper">
              <motion.button type="submit" className="submit-btn" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </div>
          </form>

          <footer className="auth-footer">
            <p>
              <Link to="/login" className="auth-link">
                <FiArrowLeft style={{ verticalAlign: 'middle' }} /> Back to login
              </Link>
            </p>
          </footer>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default ForgotPasswordPage;