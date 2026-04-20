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
  // Single SVG with both banana + SBS text forced to exact same height.
  // Text stretches horizontally to match banana width → visually equal footprint.

  return (
    <Link href="/" className="flex items-center gap-0.5 transition-transform hover:scale-105">
      <Image
        src="/sbs-logo.png"
        alt="SBS Fantasy"
        width={imgSize}
        height={imgSize}
        priority
      />
      <svg
        width={imgSize}
        height={imgSize}
        viewBox={`0 0 ${imgSize} ${imgSize}`}
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <text
          x={imgSize / 2}
          y={imgSize * 0.75}
          textAnchor="middle"
          fill="white"
          fontWeight="900"
          fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          fontSize={imgSize * 0.7}
          textLength={imgSize}
          lengthAdjust="spacingAndGlyphs"
        >
          SBS
        </text>
      </svg>
    </Link>
  );
}
