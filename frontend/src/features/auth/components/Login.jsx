import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { BsEnvelope, BsLock } from 'react-icons/bs';
import { motion } from 'framer-motion';
import ccsLogo from '../../../assets/ccs-logo.png';
import lspuLogo from '../../../assets/lspu-logo.png';
import lspuBg from '../../../assets/lspu-bg.png';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth(false);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {}
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
            <h1 className="login-title">Welcome Back!</h1>
            <p className="login-subtitle">Sign in to your account to continue.</p>
          </header>

          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-with-icon">
                <BsEnvelope
                  className="input-icon"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className={`form-input${validationErrors.email ? ' error' : ''}`}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              {validationErrors.email && (
                <span className="error-message" role="alert">
                  {validationErrors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-with-icon">
                <BsLock
                  className="input-icon"
                  aria-hidden="true"
                />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`form-input${validationErrors.password ? ' error' : ''}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              <div className="assist-row">
                <label className="remember-label" htmlFor="remember-me">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="remember-checkbox"
                  />
                  <span>Remember Me.</span>
                </label>
              </div>
              {validationErrors.password && (
                <span className="error-message" role="alert">
                  {validationErrors.password}
                </span>
              )}
            </div>

            <div className="btn-wrapper">
              <motion.button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </motion.button>
            </div>

          </form>

          <footer className="auth-footer">
            <p>
              Don't have an account?{' '}
              <a href="/register" className="auth-link">
                Create an account here.
              </a>
            </p>
          </footer>

        </motion.div>
      </section>
    </motion.div>
  );
};

export default Login;
