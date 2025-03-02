// Input.js
// Place in: frontend/src/components/ui/Input.js
import React from 'react';
import './ui.css';

const Input = ({ label, ...props }) => {
  return (
    <div className="ui-input-container">
      {label && <label className="ui-label">{label}</label>}
      <input className="ui-input" {...props} />
    </div>
  );
};

export default Input;