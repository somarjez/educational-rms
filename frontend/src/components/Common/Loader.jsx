import React from 'react';

const Loader = ({ message = 'Loading...' }) => (
  <div className="loader">
    <div className="spinner" />
    <span>{message}</span>
  </div>
);

export default Loader;
