import type { Middleware } from '../@types';

export function errorMiddlewareFactory(): Middleware {
  return async function errorMiddleware(ctx, next) {
    try {
      await next();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message;

      if (error.expose) {
        ctx.body = error;
        ctx.throw(status, message, error);
      }

      ctx.throw(status, message);
    }
  };
}
