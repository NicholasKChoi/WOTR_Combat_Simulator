import type { NextApiRequest, NextApiResponse } from 'next';
import { sendReply } from '../../../../lib/aoe4-build-order/api-route';
import { buildStoreFromEnv } from '../../../../lib/aoe4-build-order/build-store';
import { saveBuildReply } from '../../../../lib/aoe4-build-order/builds-routes';
import { englishCatalog } from '../../../../lib/aoe4-build-order/english-catalog';
import { clientKey } from '../../../../lib/aoe4-build-order/save-rate-limit';

export const config = { api: { bodyParser: { sizeLimit: '128kb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  sendReply(res, await saveBuildReply(
    { method: req.method, body: req.body, clientKey: await clientKey(req) },
    { store: buildStoreFromEnv, catalog: englishCatalog(), nowMs: Date.now() },
  ));
}
