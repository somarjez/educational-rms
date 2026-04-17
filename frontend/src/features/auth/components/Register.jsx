import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import {
  FiUser,
  FiMail,
  FiLock,
  FiBriefcase,
  FiCreditCard,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import '../styles/Register.css';
import lspuLogo from '../../../assets/images/lspu-logo.png';
import ccsLogo from '../../../assets/images/ccs-logo.png';
import bgImage from '../../../assets/images/login-bg.png';  

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'student',
    department: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match';
    }

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

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
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the auth store and displayed via the 'error' state
    }
  };

return (
    <motion.div
      className="create-account-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div
        className="left-side-background"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="background-overlay" />
      </div>

      <div className="right-side-form">
        <div className="register-panel">
          <div className="logo-row">
            <img src={lspuLogo} alt="LSPU Logo" className="school-logo" />
            <img src={ccsLogo} alt="CCS Logo" className="school-logo" />
          </div>

          <h2 className="form-title">CREATE ACCOUNT</h2>
          <p className="form-subtitle">Fill in the details to get started.</p>

          {error && <div className="alert-error-ui">{error}</div>}

          <form onSubmit={handleSubmit} className="form-ui">
            <div className="row-ui">
              <div className="input-group-ui">
                <label htmlFor="first_name">First Name</label>
                <div className="input-icon-ui">
                  <FiUser />
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder=""
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.first_name && (
                  <span className="error-text-ui">
                    {validationErrors.first_name}
                  </span>
                )}
              </div>

              <div className="input-group-ui">
                <label htmlFor="last_name">Last Name</label>
                <div className="input-icon-ui">
                  <FiUser />
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder=""
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.last_name && (
                  <span className="error-text-ui">
                    {validationErrors.last_name}
                  </span>
                )}
              </div>
            </div>

            <div className="input-group-ui">
              <label htmlFor="username">Username</label>
              <div className="input-icon-ui">
                <FiCreditCard />
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder=""
                  disabled={isLoading}
                />
              </div>
              {validationErrors.username && (
                <span className="error-text-ui">{validationErrors.username}</span>
              )}
            </div>

            <div className="input-group-ui">
              <label htmlFor="email">Email Address</label>
              <div className="input-icon-ui">
                <FiMail />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=""
                  disabled={isLoading}
                />
              </div>
              {validationErrors.email && (
                <span className="error-text-ui">{validationErrors.email}</span>
              )}
            </div>

            <div className="row-ui">
              <div className="input-group-ui">
                <label htmlFor="password">Password</label>
                <div className="input-icon-ui">
                  <FiLock />
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder=""
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.password && (
                  <span className="error-text-ui">{validationErrors.password}</span>
                )}
              </div>

              <div className="input-group-ui">
                <label htmlFor="password_confirm">Confirm Password</label>
                <div className="input-icon-ui">
                  <FiLock />
                  <input
                    id="password_confirm"
                    type="password"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    placeholder=""
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.password_confirm && (
                  <span className="error-text-ui">
                    {validationErrors.password_confirm}
                  </span>
                )}
              </div>
            </div>

            <div className="row-ui">
              <div className="input-group-ui">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="input-group-ui">
                <label htmlFor="department">Department</label>
                <div className="input-icon-ui">
                  <FiBriefcase />
                  <input
                    id="department"
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder=""
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-ui" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="bottom-text-ui">
            Already have an account? <a href="/login">Sign in here.</a>
          </p>
        </div>
      </div>
    </motion.div>
  );
};
export default Register;

