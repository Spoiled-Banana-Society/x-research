import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'marketplace_activity';

// GET /api/marketplace/activity?wallet=0x...&limit=20&cursor=...
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet parameter required' }, { status: 400 });
  }

  if (!isFirestoreConfigured()) {
    return NextResponse.json({ activities: [], hasMore: false });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10), 50);
  const cursor = req.nextUrl.searchParams.get('cursor');

  try {
    const db = getAdminFirestore();
    let query = db
      .collection(COLLECTION)
      .where('walletAddress', '==', wallet.toLowerCase())
      .orderBy('timestamp', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorDoc = await db.collection(COLLECTION).doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, limit);
    const hasMore = snapshot.docs.length > limit;

    const activities = docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    }));

    return NextResponse.json({
      activities,
      hasMore,
      nextCursor: hasMore ? docs[docs.length - 1]?.id : null,
    });
  } catch (err) {
    console.error('[activity] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

// POST /api/marketplace/activity
export async function POST(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json({ ok: true, id: null });
  }

  try {
    const body = await req.json();
    const { type, walletAddress, tokenId, teamName, price, counterparty, orderHash, txHash } = body;

    if (!type || !walletAddress || !tokenId) {
      return NextResponse.json({ error: 'type, walletAddress, and tokenId are required' }, { status: 400 });
    }

    const validTypes = ['buy', 'sell', 'list', 'cancel', 'offer_made', 'offer_accepted'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const db = getAdminFirestore();
    const docRef = await db.collection(COLLECTION).add({
      type,
      walletAddress: walletAddress.toLowerCase(),
      tokenId: String(tokenId),
      teamName: teamName || `BBB #${tokenId}`,
      price: price ?? null,
      counterparty: counterparty?.toLowerCase() ?? null,
      orderHash: orderHash ?? null,
      txHash: txHash ?? null,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err) {
    console.error('[activity] POST error:', err);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
