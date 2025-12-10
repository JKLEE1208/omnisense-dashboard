
import React from 'react';

export const OmniLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 4L34 12V28L20 36L6 28V12L20 4Z" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"/>
    <path d="M20 12L27 16V24L20 28L13 24V16L20 12Z" fill="#06b6d4" className="animate-pulse opacity-50"/>
    <path d="M20 4V12M34 12L27 16M34 28L27 24M20 36V28M6 28L13 24M6 12L13 16" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.5"/>
    <circle cx="20" cy="20" r="2" fill="#fff"/>
    <path d="M36 20C36 28.8366 28.8366 36 20 36C11.1634 36 4 28.8366 4 20C4 11.1634 11.1634 4 20 4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite] origin-center opacity-60"/>
  </svg>
);
