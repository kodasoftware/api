import { default as KoaRouter } from '@koa/router';
import compose from 'koa-compose';

import type { DefaultContext, DefaultState } from './@types';

export class Router<
  State extends {} = {},
  Context extends {} = {},
> extends KoaRouter<State & DefaultState, Context & DefaultContext> {
  public attach() {
    return compose([this.allowedMethods(), this.routes()]);
  }
}
