
import React from 'react';

export const BadgeShell: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="badge-gradient-gold" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="60%" stopColor="var(--color-focus-gold)" />
        <stop offset="100%" stopColor="#B87333" />
      </radialGradient>
      <linearGradient id="badge-gradient-silver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="100%" stopColor="#9ca3af" />
      </linearGradient>
      <filter id="drop-shadow-badge" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="1" dy="2" result="offsetblur"/>
          <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
          </feMerge>
      </filter>
    </defs>
    <g filter="url(#drop-shadow-badge)">
        <path 
            d="M50 2.5 L95 27.5 L95 72.5 L50 97.5 L5 72.5 L5 27.5 Z" 
            fill="url(#badge-gradient-gold)" 
            stroke="#a16207" 
            strokeWidth="3"
        />
        <path 
            d="M50 7 L90 30 L90 70 L50 93 L10 70 L10 30 Z" 
            fill="url(#badge-gradient-silver)" 
            stroke="#6b7280" 
            strokeWidth="1"
        />
        <g transform="translate(25, 25) scale(0.5)">
        {children}
        </g>
    </g>
  </svg>
);
