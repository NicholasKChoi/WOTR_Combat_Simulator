import type { BuildOrder, BuildOrderIssue, BuildOrderLines } from './model';
import { parseBuildOrderText } from './parse-text';
import { SIM_INPUT_BOUNDS, checkBuildOrder, type BuildOrderCatalog } from './schema';

export type TextToBuildResult =
  | { ok: true; order: BuildOrder; lines: BuildOrderLines }
  | { ok: false; issues: BuildOrderIssue[]; lines?: BuildOrderLines };

export function textToBuildOrder(text: string, catalog: BuildOrderCatalog): TextToBuildResult {
  const maxChars = SIM_INPUT_BOUNDS.textChars.max;
  if (text.length > maxChars) {
    return { ok: false, issues: [{ code: 'out-of-range', message: `text: ${text.length} characters, more than ${maxChars}` }] };
  }
  const parsed = parseBuildOrderText(text);
  if (parsed.ok === false) return parsed;
  const { lines } = parsed;
  const checked = checkBuildOrder(parsed.order, catalog, lines);
  return checked.ok ? { ok: true, order: checked.order, lines } : { ok: false, issues: checked.issues, lines };
}
