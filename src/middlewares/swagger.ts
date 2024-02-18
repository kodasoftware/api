import type { KoaSwaggerUiOptions } from 'koa2-swagger-ui';
import { koaSwagger } from 'koa2-swagger-ui';

import type { Middleware } from '../@types';

export interface SwaggerConfig extends Partial<KoaSwaggerUiOptions> {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: { [key: string]: any };
}

export function swaggerMiddlewareFactory(config: SwaggerConfig): Middleware {
  const { title, spec, swaggerOptions, ..._config } = config;

  return koaSwagger({
    title,
    routePrefix: '/docs',
    specPrefix: '/docs/spec',
    exposeSpec: true,
    hideTopbar: true,
    favicon: '/docs/favicon.png',
    swaggerOptions: {
      spec,
      jsonEditor: true,
      showRequestHeaders: true,
      swaggerVersion: '3.0.0',
      ...(swaggerOptions || {}),
    },
    ...(_config || {}),
  });
}
