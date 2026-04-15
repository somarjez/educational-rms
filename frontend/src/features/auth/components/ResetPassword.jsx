import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BsLock } from 'react-icons/bs';
import { motion } from 'framer-motion';
import lspuBg from '../../../assets/lspu-bg.png';
import ccsLogo from '../../../assets/ccs-logo.png';
import lspuLogo from '../../../assets/lspu-logo.png';
import authApi from '../../../services/authApi';
import '../styles/Login.css';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const ResetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const uid = query.get('uid') || '';
  const token = query.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!uid || !token) {
      setError('Invalid reset link.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.confirmPasswordReset(uid, token, newPassword, newPasswordConfirm);
      setMessage(data?.message || 'Password reset successfully.');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      const apiMessage = err?.response?.data?.error;
      setError(apiMessage || 'Reset link has expired or is invalid.');
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
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">Set a new password for your account.</p>
          </header>

          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          {message && (
            <div className="alert" role="status">{message}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="new_password" className="form-label">New Password</label>
              <div className="input-with-icon">
                <BsLock className="input-icon" aria-hidden="true" />
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new_password_confirm" className="form-label">Confirm New Password</label>
              <div className="input-with-icon">
                <BsLock className="input-icon" aria-hidden="true" />
                <input
                  type="password"
                  id="new_password_confirm"
                  name="new_password_confirm"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="Confirm your new password"
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="new-password"
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
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </div>
          </form>

          <footer className="auth-footer">
            <p>
              <Link to="/login" className="auth-link">Back to login</Link>
            </p>
          </footer>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default ResetPassword;
