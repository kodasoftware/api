import type { DefaultState as KoaDefaultState } from 'koa';

export type DefaultState<ExtendedState = KoaDefaultState> = {
  correlationId: string;
  auth?: { permissions: string[] };
} & ExtendedState;
