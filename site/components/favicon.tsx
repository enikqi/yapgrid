'use client'

import React from 'react'

export function Favicon() {
  return (
    <>
      {/* Favicon SVG */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden"
      >
        {/* Outer ring with gradient */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="16" cy="16" r="16" fill="url(#gradient)" />
        
        {/* Inner circle */}
        <circle cx="16" cy="16" r="12" fill="white" />
        
        {/* Grid pattern */}
        <g transform="translate(8, 8)">
          <rect x="0" y="0" width="3" height="3" fill="#f97316" rx="0.5" />
          <rect x="5" y="0" width="3" height="3" fill="#ef4444" rx="0.5" />
          <rect x="0" y="5" width="3" height="3" fill="#ec4899" rx="0.5" />
          <rect x="5" y="5" width="3" height="3" fill="#f97316" rx="0.5" />
        </g>
        
        {/* Central Y */}
        <text
          x="16"
          y="20"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#f97316"
        >
          Y
        </text>
      </svg>
    </>
  )
}

// Generate favicon data URL
export function generateFaviconDataUrl(): string {
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f97316" />
          <stop offset="50%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#ec4899" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#gradient)" />
      <circle cx="16" cy="16" r="12" fill="white" />
      <g transform="translate(8, 8)">
        <rect x="0" y="0" width="3" height="3" fill="#f97316" rx="0.5" />
        <rect x="5" y="0" width="3" height="3" fill="#ef4444" rx="0.5" />
        <rect x="0" y="5" width="3" height="3" fill="#ec4899" rx="0.5" />
        <rect x="5" y="5" width="3" height="3" fill="#f97316" rx="0.5" />
      </g>
      <text x="16" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#f97316">Y</text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
