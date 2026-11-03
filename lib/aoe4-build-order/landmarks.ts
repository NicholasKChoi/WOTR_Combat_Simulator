import type { SnapshotEntry } from './data';

// A rule on class names: completing a landmark of the current age advances it.
export const LANDMARK_CLASS = /^age[1-3]_landmark\d$/;

export const isLandmark = (entry: Pick<SnapshotEntry, 'classes'>): boolean => entry.classes.some((name) => LANDMARK_CLASS.test(name));
