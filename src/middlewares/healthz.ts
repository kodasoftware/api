import type { DefaultContext, Middleware } from '../@types';

export function healthzMiddlewareFactory<
  Response extends {} = {},
  Context extends {} = {},
  Services extends {} = {},
>(
  callback?: (
    ctx: DefaultContext<Context, Services>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<void | Response>
): Middleware<Response, Services, {}, Context> {
  return async function healthzMiddleware(ctx) {
    if (callback) {
      const response = await callback(ctx);
      if (response) ctx.body = response;
    }
    ctx.status = 200;
  };
}
