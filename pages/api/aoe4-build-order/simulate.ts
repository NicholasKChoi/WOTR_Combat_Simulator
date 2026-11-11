import type { NextApiRequest, NextApiResponse } from 'next'
import type { SimulateError, SimulateResponse } from '../../../lib/aoe4-build-order/api';
import { isPlainObject, issuesError, methodNotAllowed, notAnObjectError, sendReply } from '../../../lib/aoe4-build-order/api-route';
import { loadGameData } from '../../../lib/aoe4-build-order/data';
import { englishCatalog } from '../../../lib/aoe4-build-order/english-catalog';
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model';
import { checkBuildOrder, checkSimInputs, type BuildOrderCatalog } from '../../../lib/aoe4-build-order/schema';
import { simulateBuildOrder } from '../../../lib/aoe4-build-order/simulate';

type OrderResult = ReturnType<typeof checkBuildOrder>;

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
    sendReply(res, methodNotAllowed(req.method, ['POST']));
    return;
  }

  const body: unknown = req.body;
  if (!isPlainObject(body)) {
    sendReply(res, { status: 400, body: notAnObjectError() });
    return;
  }

  const data = loadGameData('english');
  const catalog = englishCatalog();
  const order = checkOrder(body, catalog);
  const inputs = checkSimInputs(body.inputs ?? {}, catalog);
  if (order.ok && inputs.ok) {
    sendReply(res, { status: 200, body: simulateBuildOrder(order.order, data, inputs.inputs) });
    return;
  }

  const all = [...(order.ok ? [] : order.issues), ...(inputs.ok ? [] : inputs.issues)];
  sendReply(res, { status: 400, body: issuesError(all) });
}
