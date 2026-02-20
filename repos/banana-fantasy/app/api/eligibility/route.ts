import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = "force-dynamic";
import { ApiError } from '@/lib/api/errors';
import { getSearchParam, json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { mockEligibility } from '@/lib/mock/prizes';

const API_BASE = process.env.NEXT_PUBLIC_DRAFTS_API_URL || '';
const ELIGIBILITY_COLLECTION = 'eligibilitySubmissions';

async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as Record<string, unknown>;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  } catch {
    // ignore JSON parsing errors
  }
  try {
    const text = await res.text();
    return text ? text : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;
  try {
    const userId = getSearchParam(req, 'userId');
    if (!userId) return jsonError('Missing query param: userId', 400);

    if (!API_BASE) {
      return json(mockEligibility, 200);
    }

    const url = `${API_BASE}/owner/${userId}/eligibility`;
    const res = await fetch(url, { next: { revalidate: 30 } });

    if (!res.ok) {
      const message = await readErrorMessage(res);
      console.error(`Eligibility API error: ${res.status}`, message);
      return jsonError(message || 'Eligibility service error', res.status);
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return jsonError('Invalid eligibility response from backend', 502);
    }
    return json(data, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('Eligibility fetch failed:', err);
    return jsonError('Failed to fetch eligibility', 500);
  }
}

export async function POST(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;
  try {
    if (!isFirestoreConfigured()) {
      return jsonError('Firestore is not configured', 500);
    }

    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId');
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const fullNameRaw =
      typeof body.fullName === 'string' && body.fullName.trim().length > 0
        ? body.fullName.trim()
        : `${firstName} ${lastName}`.trim();
    const fullName = requireString(fullNameRaw, 'fullName');
    const email = requireString(body.email, 'email');
    const dateOfBirth =
      typeof body.dateOfBirth === 'string' && body.dateOfBirth.trim().length > 0
        ? body.dateOfBirth.trim()
        : 'N/A';
    const country = requireString(body.country, 'country');
    const region = requireString(body.region, 'region');

    const db = getAdminFirestore();
    const submissionId = db.collection(ELIGIBILITY_COLLECTION).doc().id;
    const payload = {
      submissionId,
      userId,
      fullName,
      firstName,
      lastName,
      email,
      dateOfBirth,
      country,
      region,
      source: 'bluecheck_widget',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    await db.collection(ELIGIBILITY_COLLECTION).doc(submissionId).set(payload);

    return json({ status: 'submitted', submissionId }, 201);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('Eligibility submission failed:', err);
    return jsonError('Failed to submit verification', 500);
  }
}
