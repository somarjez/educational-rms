import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock } from 'react-icons/fi';
import { authApi } from '../../services/authApi';
import ccsLogo from '../../assets/images/ccs-logo.png';
import lspuLogo from '../../assets/images/lspu-logo.png';
import bgImage from '../../assets/images/login-bg.png';
import '../../features/auth/styles/Login.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!uid || !token) {
      setError('This reset link is invalid or incomplete.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword(uid, token, formData.newPassword, formData.confirmPassword);
      setMessage(response.message || 'Password reset successfully. You can now sign in.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to reset password.');
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
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">Choose a new password for your account.</p>
          </header>

          {message && <div className="alert alert-success" role="status">{message}</div>}
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" aria-hidden="true" />
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" aria-hidden="true" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="btn-wrapper">
              <motion.button type="submit" className="submit-btn" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </div>
          </form>

          <footer className="auth-footer">
            <p>
              <Link to="/login" className="auth-link">
                Back to login
              </Link>
            </p>
          </footer>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default ResetPasswordPage;