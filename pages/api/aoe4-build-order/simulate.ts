import type { NextApiRequest, NextApiResponse } from 'next'
import { MAX_REPORTED_ISSUES, type SimulateError, type SimulateRequest, type SimulateResponse } from '../../../lib/aoe4-build-order/api';
import { loadGameData } from '../../../lib/aoe4-build-order/data';
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model';
import { buildOrderCatalog, checkBuildOrder, checkSimInputs, type BuildOrderCatalog } from '../../../lib/aoe4-build-order/schema';
import { simulateBuildOrder } from '../../../lib/aoe4-build-order/simulate';
import { textToBuildOrder } from '../../../lib/aoe4-build-order/text-to-build';

type OrderResult = ReturnType<typeof checkBuildOrder>;

let englishCatalog: BuildOrderCatalog | undefined;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejected(code: BuildOrderIssue['code'], message: string): OrderResult {
  return { ok: false, issues: [{ code, message }] };
}

function checkOrder(body: SimulateRequest, catalog: BuildOrderCatalog): OrderResult {
  if ((body.text === undefined) === (body.buildOrder === undefined)) {
    return rejected('syntax', 'request: send exactly one of text and buildOrder');
  }
  if (body.buildOrder !== undefined) {
    return checkBuildOrder(body.buildOrder, catalog);
  }
  const { text } = body;
  if (typeof text !== 'string') {
    return rejected('syntax', 'text: must be a string');
  }
  const converted = textToBuildOrder(text, catalog);
  return converted.ok ? { ok: true, order: converted.order } : { ok: false, issues: converted.issues };
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
  const request = body as SimulateRequest;
  const order = checkOrder(request, englishCatalog);
  const inputs = checkSimInputs(request.inputs ?? {}, englishCatalog);
  if ('order' in order && 'inputs' in inputs) {
    res.status(200).json(simulateBuildOrder(order.order, data, inputs.inputs));
    return;
  }

  const all = [...('issues' in order ? order.issues : []), ...('issues' in inputs ? inputs.issues : [])];
  const issues = all.slice(0, MAX_REPORTED_ISSUES);
  const omittedIssues = all.length - issues.length;
  res.status(400).json({ error: issues[0].message, issues, ...(omittedIssues > 0 ? { omittedIssues } : {}) });
}
