import type { KoaBodyMiddlewareOptions } from 'koa-body';
import body from 'koa-body';

import type { Middleware } from '../@types';

export function bodyParserMiddlewareFactory(
  opt: Partial<KoaBodyMiddlewareOptions>
): Middleware {
  return body(opt);
}

export interface BodyOptions extends Partial<KoaBodyMiddlewareOptions> {}
