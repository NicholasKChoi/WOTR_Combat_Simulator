import type { BuildOrder, BuildOrderIssue, BuildOrderLines } from './model';
import { parseBuildOrderText } from './parse-text';
import { SIM_INPUT_BOUNDS, checkBuildOrder, type BuildOrderCatalog } from './schema';

export type TextToBuildResult =
  | { ok: true; order: BuildOrder; lines: BuildOrderLines }
  | { ok: false; issues: BuildOrderIssue[]; lines?: BuildOrderLines };

// Issues without a line sort first; the sort is stable, so equal lines keep their order.
const byLine = (a: BuildOrderIssue, b: BuildOrderIssue) => (a.line ?? 0) - (b.line ?? 0);

// A step index would point into the partial order, which the caller never sees.
function withoutStep({ step, ...rest }: BuildOrderIssue): BuildOrderIssue {
  return rest;
}

export function textToBuildOrder(text: string, catalog: BuildOrderCatalog): TextToBuildResult {
  const maxChars = SIM_INPUT_BOUNDS.textChars.max;
  if (text.length > maxChars) {
    return { ok: false, issues: [{ code: 'out-of-range', message: `text: ${text.length} characters, more than ${maxChars}` }] };
  }
  const parsed = parseBuildOrderText(text);
  if (parsed.ok === false) {
    const { order, lines } = parsed.partial;
    const checked = checkBuildOrder(order, catalog, lines, true);
    const found = checked.ok ? [] : checked.issues.map(withoutStep);
    return { ok: false, issues: [...found, ...parsed.issues].sort(byLine) };
  }
  const { lines } = parsed;
  const checked = checkBuildOrder(parsed.order, catalog, lines);
  return checked.ok ? { ok: true, order: checked.order, lines } : { ok: false, issues: checked.issues, lines };
}
