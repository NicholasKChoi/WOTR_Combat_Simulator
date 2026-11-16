import { loadGameData } from './data';
import { buildOrderCatalog, type BuildOrderCatalog } from './schema';

let catalog: BuildOrderCatalog | undefined;

/** The English BuildOrderCatalog, built once from the game data and reused (Build order input). */
export function englishCatalog(): BuildOrderCatalog {
  catalog ??= buildOrderCatalog(loadGameData('english'));
  return catalog;
}
