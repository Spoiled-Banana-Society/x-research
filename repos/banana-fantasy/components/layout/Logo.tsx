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
  // Natural letter proportions (no stretching). Font-size picked so the
  // "SBS" rendered width is roughly the banana's width at normal glyph widths.
  const fontSize = Math.round(imgSize * 0.6);

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
