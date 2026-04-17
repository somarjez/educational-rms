import React from 'react';

const ErrorMessage = ({ message }) => (
  <div className="error-message">
    {message || 'An unexpected error occurred'}
  </div>
);

export default ErrorMessage;
