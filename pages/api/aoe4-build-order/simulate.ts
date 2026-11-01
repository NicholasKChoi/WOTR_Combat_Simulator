import type { NextApiRequest, NextApiResponse } from 'next'
import type { SimulateError, SimulateRequest, SimulateResponse } from '../../../lib/aoe4-build-order/api';
import { loadGameData, type GameData } from '../../../lib/aoe4-build-order/data';
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model';
import { parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text';
import { simulateBuildOrder } from '../../../lib/aoe4-build-order/simulate';
import { resolveSimInputs, SIM_INPUT_BOUNDS, validateBuildOrder } from '../../../lib/aoe4-build-order/validate';

type OrderResult = ReturnType<typeof validateBuildOrder>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejected(code: BuildOrderIssue['code'], message: string): OrderResult {
  return { ok: false, issues: [{ code, message }] };
}

function checkOrder(body: SimulateRequest, data: GameData): OrderResult {
  if ((body.text === undefined) === (body.buildOrder === undefined)) {
    return rejected('syntax', 'request: send exactly one of text and buildOrder');
  }
  if (body.buildOrder !== undefined) {
    return validateBuildOrder(body.buildOrder, data);
  }
  const { text } = body;
  if (typeof text !== 'string') {
    return rejected('syntax', 'text: must be a string');
  }
  const maxChars = SIM_INPUT_BOUNDS.textChars.max;
  if (text.length > maxChars) {
    return rejected('out-of-range', `text: ${text.length} characters, more than ${maxChars}`);
  }
  const parsed = parseBuildOrderText(text);
  if ('issues' in parsed) {
    return { ok: false, issues: parsed.issues };
  }
  return validateBuildOrder(parsed.order, data, { lines: parsed.lines });
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
  const request = body as SimulateRequest;
  const order = checkOrder(request, data);
  const inputs = resolveSimInputs(request.inputs ?? {}, data);
  if ('order' in order && 'inputs' in inputs) {
    res.status(200).json(simulateBuildOrder(order.order, data, inputs.inputs));
    return;
  }

  const issues = [...('issues' in order ? order.issues : []), ...('issues' in inputs ? inputs.issues : [])];
  res.status(400).json({ error: issues[0].message, issues });
}
