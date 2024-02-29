import type { LogLevel } from '@kodasoftware/monitoring';
import { createLogger } from '@kodasoftware/monitoring';
import type { Server } from 'http';
import { createServer } from 'http';
import type {
  DefaultContext as KoaDefaultContext,
  DefaultState as KoaDefaultState,
} from 'koa';
import Koa from 'koa';
import serverlessHttp from 'serverless-http';

import type { BodyOptions } from './middlewares/body';
import { bodyParserMiddlewareFactory } from './middlewares/body';
import type { CorsOptions } from './middlewares/cors';
import { corsMiddlewareFactory } from './middlewares/cors';
import { errorMiddlewareFactory } from './middlewares/error';
import { loggerMiddlewareFactory } from './middlewares/logger';
import type { SwaggerConfig } from './middlewares/swagger';
import { swaggerMiddlewareFactory } from './middlewares/swagger';
import type { DefaultContext, DefaultState } from './@types';
import { healthzRouteFactory } from './routes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppConfig<Services = Record<string, any>> = {
  name: string;
  logLevel: LogLevel;
  services: Services;
};
type KoaOpts = {
  env?: string | undefined;
  keys?: string[] | undefined;
  proxy?: boolean | undefined;
  subdomainOffset?: number | undefined;
  proxyIpHeader?: string | undefined;
  maxIpsCount?: number | undefined;
  asyncLocalStorage?: boolean | undefined;
};

export function createApplication<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Services = Record<string, any>,
  State = KoaDefaultState,
  Context = KoaDefaultContext,
>(opts: {
  config: AppConfig<Services>;
  koa?: KoaOpts;
  cors?: CorsOptions;
  body?: BodyOptions;
  swagger: Omit<SwaggerConfig, 'title'>;
}) {
  return new Application<State, Context, Services>(opts);
}

class Application<
  State = KoaDefaultState,
  Context = KoaDefaultContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Services = Record<string, any>,
> extends Koa<State & DefaultState, Context & DefaultContext> {
  private _server?: Server;

  constructor(opts: {
    config: {
      name: string;
      logLevel: LogLevel;
      services?: Services;
    };
    healthz?: {
      endpoint?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback?: <Response extends {}>(
        ctx: DefaultContext
      ) => Promise<void | Response>;
    };
    koa?: KoaOpts;
    cors?: CorsOptions;
    body?: BodyOptions;
    swagger: Omit<SwaggerConfig, 'title'>;
  }) {
    super(opts.koa);
    const {
      name = process.env.hostname || process.env.user || 'localhost',
      logLevel,
      services,
    } = opts.config;

    if (services) this.context.services = services;
    this.context.log = createLogger({ name, logLevel });

    this.use(loggerMiddlewareFactory());
    this.use(errorMiddlewareFactory());
    this.use(corsMiddlewareFactory(opts.cors || {}));
    this.use(bodyParserMiddlewareFactory(opts.body || {}));
    this.use(healthzRouteFactory(opts.healthz).attach());
    this.use(
      swaggerMiddlewareFactory({
        title: name,
        ...(opts.swagger || {}),
      })
    );
  }

  public start(opts: { port: number }) {
    const callback = this.callback();
    this._server = createServer(callback).listen(opts.port);
    return this;
  }

  public end() {
    if (this._server)
      this._server.close(err => {
        this.context.log.fatal(err);
      });
    return this;
  }

  public serverless(opts?: serverlessHttp.Options) {
    return serverlessHttp(
      this,
      Object.assign(opts || {}, {
        requestId: 'x-correlation-id',
        request: this.requestTransformation.bind(this),
        // response: this.responseTransformation.bind(this),
      })
    );
  }

  private requestTransformation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any
  ) {
    request.headers['x-correlation-id'] = context.awsRequestId;
    event.headers['x-correlation-id'] = context.awsRequestId;
    this.context.log.trace({ request, event, context }, 'Request');
  }

  // private responseTransformation(
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   response: any,
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   event: any,
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   context: any
  // ) {
  //   response.setHeader('x-correlation-id', context.awsRequestId);
  //   this.context.log.trace({ response, event, context }, 'Response');
  // }
}
