// Input.js
// Place in: frontend/src/components/ui/Input.js
import React from 'react';
import './ui.css';

const Input = ({ label, icon, ...props }) => {
  return (
    <div className="ui-input-container">
      {label && <label className="ui-label">{label}</label>}
      <div className="ui-input-wrapper">
        {icon && <div className="ui-input-icon">{icon}</div>}
        <input className={`ui-input ${icon ? 'with-icon' : ''}`} {...props} />
      </div>
    </div>
  );
};

export default Input;