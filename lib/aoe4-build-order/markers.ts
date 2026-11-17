import type { SnapshotEntry } from './data';
import { AGE_NAMES, CHART_MARKER_KINDS } from './model';
import type { ChartMarker, ChartMarkerKind } from './model';

/** The chart marker kind of a researched entry: economy, unit-tier, blacksmith or other (Outputs). */
export function researchMarkerKind(entry: SnapshotEntry): Exclude<ChartMarkerKind, 'age-up'> {
  if (entry.classes.includes('economic_upgrade')) {
    return 'economy';
  }
  if (entry.type === 'upgrade' || entry.classes.includes('scar_unit_upgrade')) {
    return 'unit-tier';
  }
  if (entry.producedBy.includes('blacksmith')) {
    return 'blacksmith';
  }
  return 'other';
}

/** The chart marker for a research that completes at a time, labeled with its baseId, and with the unit it upgrades when given (Outputs). */
export function researchMarker(entry: SnapshotEntry, at: number, unit?: string): ChartMarker {
  const marker: ChartMarker = { kind: researchMarkerKind(entry), label: entry.baseId, at };
  if (unit !== undefined) {
    marker.unit = unit;
  }
  return marker;
}

/** The age-up chart marker for reaching an age at a time, labeled with the age name (Outputs). */
export function ageMarker(age: number, at: number): ChartMarker {
  return { kind: 'age-up', label: AGE_NAMES[age as keyof typeof AGE_NAMES], at };
}

/** Orders markers by time, then kind, then label (Outputs). */
export function compareMarkers(a: ChartMarker, b: ChartMarker): number {
  if (a.at !== b.at) {
    return a.at - b.at;
  }
  const byKind = CHART_MARKER_KINDS.indexOf(a.kind) - CHART_MARKER_KINDS.indexOf(b.kind);
  if (byKind !== 0) {
    return byKind;
  }
  return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
}
