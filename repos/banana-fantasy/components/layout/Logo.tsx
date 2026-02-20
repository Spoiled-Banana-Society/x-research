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
  lg: 52,
};

export function Logo({ size = 'md' }: LogoProps) {
  const imgSize = sizeMap[size];

  return (
    <Link href="/" className="flex items-center gap-1 transition-transform hover:scale-105">
      <Image
        src="/sbs-logo.png"
        alt="SBS Fantasy"
        width={imgSize}
        height={imgSize}
        className=""
      />
      <span className={`font-bold ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'} text-white`}>
        SBS
      </span>
    </Link>
  );
}
