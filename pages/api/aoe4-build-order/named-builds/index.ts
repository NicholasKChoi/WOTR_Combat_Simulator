import type { NextApiRequest, NextApiResponse } from 'next';
import type { BuildsError, SimulateError } from '../../../../lib/aoe4-build-order/api';
import { sendReply } from '../../../../lib/aoe4-build-order/api-route';
import { buildStoreFromEnv } from '../../../../lib/aoe4-build-order/build-store';
import { englishCatalog } from '../../../../lib/aoe4-build-order/english-catalog';
import type { CreateNamedBuildResponse } from '../../../../lib/aoe4-build-order/named-builds';
import { createNamedBuildReply } from '../../../../lib/aoe4-build-order/named-builds-routes';
import { clientKey } from '../../../../lib/aoe4-build-order/save-rate-limit';

export const config = { api: { bodyParser: { sizeLimit: '128kb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse<CreateNamedBuildResponse | BuildsError | SimulateError>) {
  sendReply(res, await createNamedBuildReply(
    { method: req.method, body: req.body, clientKey: await clientKey(req) },
    { store: buildStoreFromEnv, catalog: englishCatalog(), nowMs: Date.now() },
  ));
}
