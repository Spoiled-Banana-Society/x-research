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
  // Font size picked so the "SBS" cap-height visually matches the banana height.
  // Rule of thumb: cap-height ≈ 70% of font-size, so font-size ≈ imgSize * 1.2.
  const fontSize = Math.round(imgSize * 0.9);

  return (
    <Link href="/" className="flex items-center gap-1 transition-transform hover:scale-105">
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
