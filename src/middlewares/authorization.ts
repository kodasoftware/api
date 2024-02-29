import type { Middleware } from '../@types';

export abstract class AuthService<
  Auth extends { permissions: string[] } = { permissions: string[] },
> {
  abstract isAuthorised(auth: Auth, permission: string): Promise<boolean>;
}

export type AuthorizationMiddleware<
  Auth extends { permissions: string[] } = { permissions: string[] },
  _AuthService extends AuthService | undefined = undefined,
> = Middleware<{}, { auth?: _AuthService }, { auth: Auth }>;

export function authorizationMiddlewareFactory<
  Auth extends { permissions: string[] } = { permissions: string[] },
  _AuthService extends AuthService | undefined = undefined,
>(opts: {
  permission: { required: string };
}): AuthorizationMiddleware<Auth, _AuthService> {
  return async function authorizationMiddleware(ctx, next) {
    const _ctx: typeof ctx = ctx;
    const auth = ctx.state.auth;
    _ctx.assert(auth, 401, 'Unauthorized');

    // Check permissions
    _ctx.assert(
      auth.permissions.includes(opts.permission.required),
      401,
      'Unauthorized'
    );

    if (ctx.services?.auth) {
      const authorised = await ctx.services.auth.isAuthorised(
        ctx.state.auth,
        opts.permission.required
      );
      _ctx.assert(authorised, 401, 'Unauthorized');
    }

    return next();
  };
}
