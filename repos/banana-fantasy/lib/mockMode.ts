export function isMockDataEnabled(): boolean {
  const raw = (process.env.USE_MOCK_DATA || '').toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}
