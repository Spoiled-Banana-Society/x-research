'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', elevated = false, onClick, hoverable = false }: CardProps) {
  const baseStyles = elevated
    ? 'bg-bg-tertiary border border-bg-elevated'
    : 'bg-bg-secondary border border-bg-tertiary';

  return (
    <div
      className={`
        ${baseStyles}
        rounded-xl p-6
        ${hoverable ? 'cursor-pointer hover:border-banana/30 transition-colors duration-200' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
