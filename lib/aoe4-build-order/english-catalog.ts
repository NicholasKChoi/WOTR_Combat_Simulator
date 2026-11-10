import { loadGameData } from './data';
import { buildOrderCatalog, type BuildOrderCatalog } from './schema';

let catalog: BuildOrderCatalog | undefined;

export function englishCatalog(): BuildOrderCatalog {
  catalog ??= buildOrderCatalog(loadGameData('english'));
  return catalog;
}
