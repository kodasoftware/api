import type { DefaultState as KoaDefaultState } from 'koa';

export type DefaultState<
  Auth extends {} = {},
  ExtendedState = KoaDefaultState,
> = {
  correlationId: string;
  auth?: Auth;
} & ExtendedState;
