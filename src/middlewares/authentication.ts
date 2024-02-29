import { decode, verify } from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';

import type { Middleware } from '../@types';

export function authenticationMiddlewareFactory(opts: {
  jwksUri?: string;
  cache?: boolean;
  publicKey?: string;
}): Middleware {
  return async function authenticationMiddleware(ctx, next) {
    if (ctx.state.auth) return next();

    const _ctx: typeof ctx = ctx;
    const auth = ctx.req.headers.authorization;
    _ctx.assert(auth, 401, 'Unauthorized');

    const [type, token] = auth.split(' ');
    _ctx.assert(type, 401, 'Invalid authorization header');
    _ctx.assert(token, 401, 'No authorization token provided');

    if (type !== 'Bearer') ctx.throw(401, 'Invalid authorization header');

    const decoded = decode(token, { complete: true });
    const {
      header: { kid },
    } = decoded || { header: {} };
    _ctx.assert(kid && decoded, 401, 'Invalid token provided');

    let _publicKey: string;

    if (!opts.publicKey) {
      const jwksClient = JwksRsa({
        jwksUri: opts.jwksUri || 'http://localhost/.well-known/',
        cache: !!opts.cache,
      });
      const key = await new Promise<null | JwksRsa.SigningKey>(res => {
        jwksClient.getSigningKey(kid, (err, key) => {
          if (err || !key) return res(null);
          res(key);
        });
      });
      _ctx.assert(
        key && key.getPublicKey(),
        401,
        'Could not retrieve signing key'
      );
      _publicKey = key.getPublicKey();
    } else _publicKey = opts.publicKey;

    const verified = await new Promise(res => {
      verify(token, _publicKey!, { complete: true }, (err, decoded) => {
        if (err) res(false);
        if (!decoded) res(false);
        res(true);
      });
    });
    _ctx.assert(verified, 401, 'Unauthorized');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.state.auth = decoded.payload as any;

    return next();
  };
}
