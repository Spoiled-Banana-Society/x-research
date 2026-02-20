import type { DepthChartPlayer, TeamPosition } from '@/types';
import { mockTeamPositions } from '@/lib/mock/teamPositions';

export function getTeamPositionDepthChart(team: string, position: string): DepthChartPlayer[] {
  const entry = mockTeamPositions.find(
    (tp) => tp.team === team && tp.position === position,
  );
  return entry?.depthChart ?? [];
}

export function getTeamPosition(team: string, position: string): TeamPosition | null {
  return (
    mockTeamPositions.find((tp) => tp.team === team && tp.position === position) ??
    null
  );
}
