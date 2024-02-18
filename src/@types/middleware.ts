import type { Middleware as KoaMiddleware } from 'koa';

import type { DefaultContext } from './context';
import type { DefaultState } from './state';

export type Middleware<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Response extends {} = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Services extends {} = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  State extends {} = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Context extends {} = {},
> = KoaMiddleware<
  State & DefaultState,
  DefaultContext<Context, Services>,
  Response
>;
