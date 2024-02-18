import type { Logger } from '@kodasoftware/monitoring';
import type { DefaultContext as KoaDefaultContext } from 'koa';

export type DefaultContext<
  ExtendedContext = KoaDefaultContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Services = Record<string, any>,
> = {
  log: Logger;
  services: Services;
  params: { [key: string]: string | number };
} & ExtendedContext;
