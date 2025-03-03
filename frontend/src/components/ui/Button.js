// Button.js
// Place in: frontend/src/components/ui/Button.js
import React from 'react';
import './ui.css';

const Button = ({ children, variant = 'primary', ...props }) => {
  return (
    <button className={`ui-button ${variant}`} {...props}>
      {children}
    </button>
  );
};

export default Button;