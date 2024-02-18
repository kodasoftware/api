import cors from '@koa/cors';

import type { Middleware } from '../@types';

export function corsMiddlewareFactory(opts: cors.Options): Middleware {
  return cors(opts);
}

export interface CorsOptions extends cors.Options {}
