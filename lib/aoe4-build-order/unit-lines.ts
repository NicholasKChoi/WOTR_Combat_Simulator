import type { SnapshotEntry } from './data';

/** The display name of a unit line: the longest run of whole words ending every tier's name, else the lowest-age tier's name (Outputs). */
export function unitLineName(entries: readonly SnapshotEntry[]): string {
  const lowest = entries.reduce((best, entry) => (entry.age < best.age ? entry : best));
  const words = entries.map((entry) => entry.name.split(' '));
  const shortest = Math.min(...words.map((w) => w.length));
  let shared = 0;
  while (shared < shortest && words.every((w) => w[w.length - 1 - shared] === words[0][words[0].length - 1 - shared])) {
    shared += 1;
  }
  return shared === 0 ? lowest.name : words[0].slice(words[0].length - shared).join(' ');
}
