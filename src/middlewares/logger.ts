import { randomUUID } from 'crypto';

import type { Middleware } from '../@types';

export function loggerMiddlewareFactory(): Middleware {
  return async function loggerMiddleware(ctx, next) {
    const start = Date.now();
    const method = ctx.method;
    const path = ctx.path;
    const query = ctx.query;
    const headers = ctx.headers;
    let correlationId: string;

    if (!ctx.headers['x-correlation-id']) {
      correlationId = randomUUID();
    } else correlationId = ctx.headers['x-correlation-id'] as string;

    ctx.set('x-correlation-id', correlationId);
    ctx.state.correlationId = correlationId;
    ctx.log = ctx.log.child({ correlationId, method, path, query, headers });

    try {
      await next();

      const end = Date.now();
      const duration = end - start;
      const status = ctx.status;

      ctx.log.info({ status, duration });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const end = Date.now();
      const duration = end - start;
      const status = error.status || 500;

      ctx.log.error(error, error.message, {
        status,
        duration,
      });
    }
  };
}
