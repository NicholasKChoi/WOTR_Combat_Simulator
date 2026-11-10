import type { NextApiRequest, NextApiResponse } from 'next';
import { sendReply } from '../../../../lib/aoe4-build-order/api-route';
import { buildStoreFromEnv } from '../../../../lib/aoe4-build-order/build-store';
import { savedBuildReply } from '../../../../lib/aoe4-build-order/builds-routes';
import { storageEnv } from '../../../../lib/aoe4-build-order/saved-builds';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  sendReply(res, await savedBuildReply(
    { method: req.method, id: req.query.id },
    { store: buildStoreFromEnv, env: storageEnv(process.env.VERCEL_ENV) },
  ));
}
