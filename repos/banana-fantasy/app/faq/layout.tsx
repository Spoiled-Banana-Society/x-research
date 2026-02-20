import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Read frequently asked questions about Banana Fantasy gameplay, drafting, passes, and payouts.',
  alternates: {
    canonical: '/faq',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
