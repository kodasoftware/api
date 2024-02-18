import type { Middleware } from '../@types';

export function authorizationMiddlewareFactory(opts: {
  permissions: { required: string };
}): Middleware {
  return async function authorizationMiddleware(ctx, next) {
    const _ctx: typeof ctx = ctx;
    const auth = ctx.state.auth;
    _ctx.assert(auth, 401, 'Unauthorized');

    // Check permissions
    _ctx.assert(
      auth.permissions.includes(opts.permissions.required),
      401,
      'Unauthorized'
    );

    return next();
  };
}
