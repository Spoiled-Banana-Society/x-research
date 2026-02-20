import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Browse and trade drafted teams in the Banana Fantasy marketplace for onchain best ball assets.',
  alternates: {
    canonical: '/marketplace',
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
