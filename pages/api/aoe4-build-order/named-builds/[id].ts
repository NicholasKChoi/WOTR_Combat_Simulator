import type { NextApiRequest, NextApiResponse } from 'next';
import type { BuildsError, SimulateError } from '../../../../lib/aoe4-build-order/api';
import { sendReply } from '../../../../lib/aoe4-build-order/api-route';
import { buildStoreFromEnv } from '../../../../lib/aoe4-build-order/build-store';
import { englishCatalog } from '../../../../lib/aoe4-build-order/english-catalog';
import type { NamedBuild, UpdateNamedBuildResponse } from '../../../../lib/aoe4-build-order/named-builds';
import { namedBuildReply } from '../../../../lib/aoe4-build-order/named-builds-routes';
import { deploymentEnv } from '../../../../lib/aoe4-build-order/saved-builds';
import { clientKey } from '../../../../lib/aoe4-build-order/save-rate-limit';

export const config = { api: { bodyParser: { sizeLimit: '128kb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse<NamedBuild | UpdateNamedBuildResponse | BuildsError | SimulateError>) {
  sendReply(res, await namedBuildReply(
    {
      method: req.method,
      id: req.query.id,
      body: req.body,
      authorization: req.headers.authorization,
      ifMatch: req.headers['if-match'],
      clientKey: await clientKey(req),
    },
    {
      store: buildStoreFromEnv,
      catalog: englishCatalog(),
      env: deploymentEnv({ VERCEL: process.env.VERCEL, VERCEL_ENV: process.env.VERCEL_ENV }),
      nowMs: Date.now(),
    },
  ));
}
