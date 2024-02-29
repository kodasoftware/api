import type { Middleware as KoaMiddleware } from 'koa';

import type { DefaultContext } from './context';
import type { DefaultState } from './state';

export type Middleware<
  Response extends {} = {},
  Services extends {} = {},
  State extends {} = {},
  Context extends {} = {},
  Auth extends {} = {},
> = KoaMiddleware<
  State & DefaultState<Auth, State>,
  DefaultContext<Context, Services>,
  Response
>;
