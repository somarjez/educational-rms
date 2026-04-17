import React from 'react';

const SectionCard = ({ title, actions, children }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
};

export default SectionCard;
