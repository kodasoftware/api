import { HttpError as KoaHttpError } from 'koa';

import type { Middleware } from '../@types';

export function errorMiddlewareFactory(): Middleware {
  return async function errorMiddleware(ctx, next) {
    try {
      await next();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message;

      ctx.status = status;

      if (!message) ctx.throw(status);
      if (error instanceof KoaHttpError) throw error;
      if (error.expose) ctx.throw(status, message, error);

      ctx.throw(status, message);
    }
  };
}
