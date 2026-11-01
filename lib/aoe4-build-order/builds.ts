// Prebuilt build orders. A new build is one JSON file in data/aoe4-build-order/builds/ plus one entry here.
import english1tc from '../../data/aoe4-build-order/builds/english-1tc.json';
import type { BuildOrder } from './model';

const BUILDS: readonly BuildOrder[] = [english1tc as unknown as BuildOrder];

export function listBuilds(): BuildOrder[] {
  return [...BUILDS];
}
