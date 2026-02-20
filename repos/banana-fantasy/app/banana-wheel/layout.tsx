import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Banana Wheel Promo',
  description:
    'Spin the Banana Wheel promo to win free draft entries and bonus contest rewards on Banana Fantasy.',
  alternates: {
    canonical: '/banana-wheel',
  },
};

export default function BananaWheelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
