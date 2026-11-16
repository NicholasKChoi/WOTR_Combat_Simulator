import type { GameData } from './data';
import type { BuildingSeries } from './model';
import { compareCodeUnits } from './step-options';

function hasBuildingEntry(data: GameData, baseId: string): boolean {
  return data.byBaseId.get(baseId)?.some((entry) => entry.type === 'building') ?? false;
}

/** The building baseIds that some unit entry lists in producedBy (Outputs). */
export function productionBuildingIds(data: GameData): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const entry of data.byId.values()) {
    if (entry.type !== 'unit') continue;
    for (const baseId of entry.producedBy) {
      if (hasBuildingEntry(data, baseId)) ids.add(baseId);
    }
  }
  return ids;
}

/** Completed-instance counts per production building, ordered by first appearance; samples[i] maps a building baseId to its completed instances at times[i] (Outputs). */
export function productionBuildingSeries(data: GameData, samples: readonly ReadonlyMap<string, number>[]): BuildingSeries[] {
  const series = [...productionBuildingIds(data)].flatMap((baseId) => {
    const counts = samples.map((sample) => sample.get(baseId) ?? 0);
    const first = counts.findIndex((count) => count > 0);
    // byBaseId lists each baseId's entries by age, so this is the lowest-age building name.
    const name = data.byBaseId.get(baseId)?.find((entry) => entry.type === 'building')?.name ?? baseId;
    return first < 0 ? [] : [{ first, baseId, name, counts }];
  });
  return series.sort((a, b) => a.first - b.first || compareCodeUnits(a.baseId, b.baseId)).map(({ baseId, name, counts }) => ({ baseId, name, counts }));
}
