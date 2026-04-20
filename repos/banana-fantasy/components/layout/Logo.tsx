'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 36,
  md: 44,
  lg: 56,
};

export function Logo({ size = 'md' }: LogoProps) {
  const imgSize = sizeMap[size];
  // "SBS" wordmark is forced to exactly match the icon's width via SVG
  // textLength + lengthAdjust="spacingAndGlyphs". Height set to ~40% of icon.
  const wordHeight = Math.round(imgSize * 0.4);

  return (
    <Link href="/" className="flex items-center gap-1 transition-transform hover:scale-105">
      <Image
        src="/sbs-logo.png"
        alt="SBS Fantasy"
        width={imgSize}
        height={imgSize}
        priority
      />
      <svg
        width={imgSize}
        height={wordHeight}
        viewBox={`0 0 ${imgSize} ${wordHeight}`}
        aria-hidden="true"
      >
        <text
          x={imgSize / 2}
          y={wordHeight * 0.85}
          textAnchor="middle"
          fill="white"
          fontWeight="900"
          fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          fontSize={wordHeight}
          textLength={imgSize}
          lengthAdjust="spacingAndGlyphs"
        >
          SBS
        </text>
      </svg>
    </Link>
  );
}
