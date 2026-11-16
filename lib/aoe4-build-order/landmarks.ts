import type { SnapshotEntry } from './data';

/** The class-name rule for landmarks: completing a landmark of the current age advances it (Model rules). */
export const LANDMARK_CLASS = /^age[1-3]_landmark\d$/;

/** Whether any of an entry's classes matches LANDMARK_CLASS (Model rules). */
export const isLandmark = (entry: Pick<SnapshotEntry, 'classes'>): boolean => entry.classes.some((name) => LANDMARK_CLASS.test(name));
