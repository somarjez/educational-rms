import React from 'react';

const Icon = ({ icon: IconComponent, className = '', ...props }) => (
  <span className={`icon ${className}`} {...props}>
    <IconComponent />
  </span>
);

export default Icon;
