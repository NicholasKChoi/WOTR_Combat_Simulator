import type { NextApiRequest, NextApiResponse } from 'next'
import { MAX_REPORTED_ISSUES, type SimulateError, type SimulateResponse } from '../../../lib/aoe4-build-order/api';
import { loadGameData } from '../../../lib/aoe4-build-order/data';
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model';
import { buildOrderCatalog, checkBuildOrder, checkSimInputs, type BuildOrderCatalog } from '../../../lib/aoe4-build-order/schema';
import { simulateBuildOrder } from '../../../lib/aoe4-build-order/simulate';

type OrderResult = ReturnType<typeof checkBuildOrder>;

let englishCatalog: BuildOrderCatalog | undefined;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejected(code: BuildOrderIssue['code'], message: string): OrderResult {
  return { ok: false, issues: [{ code, message }] };
}

function checkOrder(body: Record<string, unknown>, catalog: BuildOrderCatalog): OrderResult {
  if (Object.hasOwn(body, 'text')) {
    return rejected('syntax', 'request: text is no longer accepted; convert the paste to buildOrder and send that');
  }
  if (body.buildOrder === undefined) {
    return rejected('syntax', 'request: missing buildOrder');
  }
  return checkBuildOrder(body.buildOrder, catalog);
}

export default function handler(req: NextApiRequest, res: NextApiResponse<SimulateResponse | SimulateError | Pick<SimulateError, 'error'>>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: `method ${req.method} is not allowed; use POST` });
    return;
  }

  const body: unknown = req.body;
  if (!isPlainObject(body)) {
    const message = 'request body: must be a JSON object';
    res.status(400).json({ error: message, issues: [{ code: 'syntax', message }] });
    return;
  }

  const data = loadGameData('english');
  englishCatalog ??= buildOrderCatalog(data);
  const order = checkOrder(body, englishCatalog);
  const inputs = checkSimInputs(body.inputs ?? {}, englishCatalog);
  if ('order' in order && 'inputs' in inputs) {
    res.status(200).json(simulateBuildOrder(order.order, data, inputs.inputs));
    return;
  }

  const all = [...('issues' in order ? order.issues : []), ...('issues' in inputs ? inputs.issues : [])];
  const issues = all.slice(0, MAX_REPORTED_ISSUES);
  const omittedIssues = all.length - issues.length;
  res.status(400).json({ error: issues[0].message, issues, ...(omittedIssues > 0 ? { omittedIssues } : {}) });
}
