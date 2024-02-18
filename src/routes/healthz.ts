import type { DefaultContext } from '../@types';
import { healthzMiddlewareFactory } from '../middlewares/healthz';
import { Router } from '../router';

export function healthzRouteFactory<Response extends {}>(config?: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback?: (ctx: DefaultContext) => Promise<void | Response>;
  endpoint?: string;
}): Router {
  const { endpoint = '/healthz', callback } = config || {};
  const route = new Router();
  route.get('healthz', endpoint, healthzMiddlewareFactory(callback));
  return route;
}
