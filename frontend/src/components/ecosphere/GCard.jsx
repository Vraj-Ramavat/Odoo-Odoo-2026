import React from 'react';

export function GCard({ children, className = '', padded = true, style }) {
  return (
    <div
      className={`rounded-lg border border-border bg-card shadow-sm ${padded ? 'p-5' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
