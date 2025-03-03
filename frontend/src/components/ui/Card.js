// Card.js
// Place in: frontend/src/components/ui/Card.js
import React from 'react';
import './ui.css';

const Card = ({ children, className = '' }) => {
  return <div className={`ui-card ${className}`}>{children}</div>;
};

export default Card;