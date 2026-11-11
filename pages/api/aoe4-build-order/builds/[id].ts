import type { NextApiRequest, NextApiResponse } from 'next';
import type { BuildsError } from '../../../../lib/aoe4-build-order/api';
import { sendReply } from '../../../../lib/aoe4-build-order/api-route';
import { buildStoreFromEnv } from '../../../../lib/aoe4-build-order/build-store';
import { savedBuildReply } from '../../../../lib/aoe4-build-order/builds-routes';
import { deploymentEnv, type SavedBuild } from '../../../../lib/aoe4-build-order/saved-builds';

export default async function handler(req: NextApiRequest, res: NextApiResponse<(SavedBuild & { id: string }) | BuildsError>) {
  sendReply(res, await savedBuildReply(
    { method: req.method, id: req.query.id },
    { store: buildStoreFromEnv, env: deploymentEnv({ VERCEL: process.env.VERCEL, VERCEL_ENV: process.env.VERCEL_ENV }) },
  ));
}
