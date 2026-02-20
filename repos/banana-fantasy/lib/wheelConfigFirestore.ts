import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { wheelSegments, type WheelSegment } from '@/lib/wheelConfig';

const WHEEL_CONFIG_DOC_PATH = 'config/wheel';
const CACHE_TTL_MS = 5 * 60 * 1000;

type WheelConfigDoc = {
  segments?: WheelSegment[];
  updatedAt?: string;
};

type WheelConfigResult = {
  segments: WheelSegment[];
  segmentAngle: number;
};

let cachedConfig: WheelConfigResult | null = null;
let cachedAtMs = 0;

function buildConfig(segments: WheelSegment[]): WheelConfigResult {
  return {
    segments,
    segmentAngle: 360 / segments.length,
  };
}

function getFallbackConfig(): WheelConfigResult {
  return buildConfig(wheelSegments);
}

function isWheelSegment(value: unknown): value is WheelSegment {
  if (!value || typeof value !== 'object') return false;
  const segment = value as Record<string, unknown>;
  return (
    typeof segment.id === 'string' &&
    typeof segment.label === 'string' &&
    typeof segment.probability === 'number' &&
    typeof segment.prizeType === 'string' &&
    typeof segment.color === 'string'
  );
}

function isValidSegments(segments: unknown): segments is WheelSegment[] {
  return Array.isArray(segments) && segments.length > 0 && segments.every(isWheelSegment);
}

export async function getWheelConfig(): Promise<WheelConfigResult> {
  const now = Date.now();
  if (cachedConfig && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const db = getAdminFirestore();
    const snapshot = await db.doc(WHEEL_CONFIG_DOC_PATH).get();
    const data = (snapshot.data() ?? null) as WheelConfigDoc | null;

    if (!data || !isValidSegments(data.segments)) {
      const fallback = getFallbackConfig();
      cachedConfig = fallback;
      cachedAtMs = now;
      return fallback;
    }

    const firestoreConfig = buildConfig(data.segments);
    cachedConfig = firestoreConfig;
    cachedAtMs = now;
    return firestoreConfig;
  } catch (error) {
    console.error('[wheelConfigFirestore] Failed to read Firestore config, using fallback', error);
    const fallback = getFallbackConfig();
    cachedConfig = fallback;
    cachedAtMs = now;
    return fallback;
  }
}
