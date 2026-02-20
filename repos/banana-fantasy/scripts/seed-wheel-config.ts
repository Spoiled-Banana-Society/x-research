import { getAdminFirestore } from '../lib/firebaseAdmin';
import { wheelSegments } from '../lib/wheelConfig';

const WHEEL_CONFIG_DOC_PATH = 'config/wheel';

async function seedWheelConfig() {
  const db = getAdminFirestore();
  const payload = {
    segments: wheelSegments,
    updatedAt: new Date().toISOString(),
  };

  await db.doc(WHEEL_CONFIG_DOC_PATH).set(payload);

  console.log(
    `[seed-wheel-config] Seeded ${WHEEL_CONFIG_DOC_PATH} with ${wheelSegments.length} segments at ${payload.updatedAt}`,
  );
}

seedWheelConfig().catch((error) => {
  console.error('[seed-wheel-config] Failed to seed wheel config', error);
  process.exitCode = 1;
});
