'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Draft Lobby is now unified into the Draft Room page.
 * This page redirects to /draft-room preserving all query params.
 */
function DraftLobbyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams?.toString() || '';
    router.replace(`/draft-room${params ? `?${params}` : ''}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="text-white/40 animate-pulse">Redirecting to draft room...</div>
    </div>
  );
}

export default function DraftLobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="text-white/40 animate-pulse">Loading...</div>
      </div>
    }>
      <DraftLobbyRedirect />
    </Suspense>
  );
}
