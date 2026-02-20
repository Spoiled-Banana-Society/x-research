import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Draft Passes',
  description:
    'Purchase Banana Fantasy draft passes and enter more onchain best ball fantasy football contests.',
  alternates: {
    canonical: '/buy-drafts',
  },
};

export default function BuyDraftsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
