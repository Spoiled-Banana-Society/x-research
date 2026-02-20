import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Identity Verification',
  description:
    'Complete identity verification for Banana Fantasy to unlock eligible onchain fantasy football contests.',
  alternates: {
    canonical: '/verify',
  },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
