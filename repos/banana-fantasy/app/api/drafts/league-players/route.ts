import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';

/**
 * GET /api/drafts/league-players?draftId=xxx
 *
 * Reads the Firestore league document to get the current player count.
 * Used by the draft room to show real-time filling progress.
 */
export async function GET(req: NextRequest) {
  const draftId = req.nextUrl.searchParams.get('draftId');
  if (!draftId) {
    return NextResponse.json({ error: 'Missing draftId' }, { status: 400 });
  }

  const configured = isFirestoreConfigured();
  if (!configured) {
    return NextResponse.json({ numPlayers: 0, players: [], debug: 'firestore_not_configured' }, { status: 200 });
  }

  try {
    const db = getAdminFirestore();
    const doc = await db.collection('drafts').doc(draftId).get();

    if (!doc.exists) {
      return NextResponse.json({ numPlayers: 0, players: [], debug: `doc_not_found:${draftId}` }, { status: 200 });
    }

    const data = doc.data()!;
    const numPlayers = Number(data.NumPlayers ?? data.numPlayers ?? 0);
    const currentUsers: Array<{ OwnerId?: string; ownerId?: string }> =
      data.CurrentUsers ?? data.currentUsers ?? [];

    return NextResponse.json({
      numPlayers,
      players: currentUsers.map((u) => u.OwnerId || u.ownerId || ''),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ numPlayers: 0, players: [], debug: `error:${msg}` }, { status: 200 });
  }
}
