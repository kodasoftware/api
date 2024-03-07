import { createLogger, type LogLevel } from '@kodasoftware/monitoring';
import { createServer, type Server } from 'http';
import Koa, {
  type DefaultContext as KoaDefaultContext,
  type DefaultState as KoaDefaultState,
} from 'koa';
import type { Options } from 'serverless-http';

import {
  type BodyOptions,
  bodyParserMiddlewareFactory,
} from './middlewares/body';
import { corsMiddlewareFactory, type CorsOptions } from './middlewares/cors';
import { errorMiddlewareFactory } from './middlewares/error';
import { loggerMiddlewareFactory } from './middlewares/logger';
import {
  type SwaggerConfig,
  swaggerMiddlewareFactory,
} from './middlewares/swagger';
import type { DefaultContext, DefaultState } from './@types';
import { healthzRouteFactory } from './routes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppConfig<Services = Record<string, any>> = {
  name: string;
  logLevel?: LogLevel;
  services?: Services;
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

interface ServerlessOpts extends Omit<Options, 'provider'> {
  provider?: 'aws' | 'azure' | 'gcloud';
}

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
  swagger?: Omit<SwaggerConfig, 'title'>;
}) {
  return new Application<State, Context, Services>(opts);
}

export class Application<
  State = KoaDefaultState,
  Context = KoaDefaultContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Services = Record<string, any>,
> extends Koa<State & DefaultState, Context & DefaultContext> {
  private _server?: Server;
  private readonly name: string;

  constructor(opts: {
    config: {
      name: string;
      logLevel?: LogLevel;
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
    swagger?: Omit<SwaggerConfig, 'title'>;
  }) {
    super(opts.koa);
    const {
      name = process.env.hostname || process.env.user || 'localhost',
      logLevel,
      services,
    } = opts.config;

    this.name = name;
    this.context.services = services || {};
    this.context.log = createLogger({ name, logLevel: logLevel || 'error' });

    this.use(loggerMiddlewareFactory());
    this.use(errorMiddlewareFactory());
    this.use(corsMiddlewareFactory(opts.cors || {}));
    this.use(bodyParserMiddlewareFactory(opts.body || {}));
    this.use(healthzRouteFactory(opts.healthz).attach());

    if (opts.swagger) {
      const {
        spec: { definition = {}, ..._spec },
      } = opts.swagger;
      const { info = {}, ..._definition } = definition;
      this.use(
        swaggerMiddlewareFactory({
          title: name,
          spec: {
            definition: {
              info: {
                title: name,
                ...info,
              },
              ..._definition,
            },
            ..._spec,
          },
        })
      );
    }
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

  public serverless(opts?: ServerlessOpts) {
    if (opts?.provider === 'gcloud') {
      // Handle Google Cloud serverless
      return import('@google-cloud/functions-framework').then(({ http }) =>
        http(this.name, this.callback())
      );
    }

    // Handle AWS and Azure serverless
    return import('serverless-http').then(({ default: serverlessHttp }) =>
      serverlessHttp(
        this,
        Object.assign((opts as Options) || {}, {
          requestId: 'x-correlation-id',
          ...(opts?.provider === 'aws' || !opts?.provider
            ? { request: this.requestTransformation.bind(this) }
            : {}),
        })
      )
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
}
