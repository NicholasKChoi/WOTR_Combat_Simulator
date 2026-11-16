import type { GameData } from './data';

/** Build time for a number of builders from the base time and the data's builder scaling; throws unless builders is an integer of at least 1 (Model rules). */
export function constructionSeconds(baseSeconds: number, builders: number, data: GameData): number {
  if (!Number.isInteger(builders) || builders < 1) {
    throw new RangeError(`constructionSeconds: builders must be an integer >= 1, got ${builders}`);
  }
  const { numerator, offset } = data.base.builderScaling;
  return (baseSeconds * numerator.value) / (builders + offset.value);
}
