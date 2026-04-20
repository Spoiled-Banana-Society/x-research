'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 44,
};

export function Logo({ size = 'md' }: LogoProps) {
  const imgSize = sizeMap[size];
  // Polymarket-style lockup: text cap-height ≈ icon height, natural letter
  // widths, small consistent gap. Font-size / 0.7 ≈ icon height.
  const fontSize = Math.round(imgSize * 0.75);

  return (
    <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
      <Image
        src="/sbs-logo.png"
        alt="SBS Fantasy"
        width={imgSize}
        height={imgSize}
        priority
      />
      <span
        className="font-black tracking-tight leading-none text-white"
        style={{ fontSize: `${fontSize}px` }}
      >
        SBS
      </span>
    </Link>
  );
}
