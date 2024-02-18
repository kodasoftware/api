# Koda Software API Library

A library for create Node, Koa-based applications. It facilitates both HTTP server and serverless exports of your APIs.

## Using this library

In order to use this library you should first create your application using the factory function. (This example uses the [config library](https://www.npmjs.com/package/config)):

`index.ts`

```typescript
import { application } from './app';
import configuration from 'config'

// Start the server
const config = configuration.util.toObject();
try {
  application.start({ port: config.app.port });
} catch (err) {
  application.end();
}

// Or you can export as a serverless handler instead with the below - simple!
// export const handler = application.serverless();

```

`app.ts`

```typescript
import { createApplication, generateSwaggerSpec } from '@kodasoftware/api';
import configuration from 'config'

import { AccountService, CoffeeService } from './lib/services';
import { accountRouteFactory, coffeeRouteFactory } from './routes';

const config = configuration.util.toObject();
export const application = createApplication({
  config: {
    name: config.app.name,
    logLevel: config.log.level,
    // This attaches services to the request context, accessible in a middleware via `ctx.services`
    services: {
      account: new AccountService(),
      coffee: new CoffeeService(),
    },
  },
  cors: { origin: config.cors.origin },
  // Specify koa options constructor
  koa: {},
  // Specify options for koa-body
  body: {},
  swagger: {
    spec: generateSwaggerSpec({
      definition: {
        info: {
          title: config.app.name,
          version: config.app.version,
        },
      },
    }),
  },
});

application.use(accountRouteFactory().attach());
application.use(coffeeRouteFactory().attach());

```

`lib/services.ts`

```typescript
export class AccountService {
  public async retrieveAccounts() {
    return fetch('https://api.sampleapis.com/fakebank/accounts').then(res =>
      res.json()
    );
  }
}

export class CoffeeService {
  public async retrieveCoffee(type: 'hot' | 'iced') {
    return await fetch(
      new URL(`https://api.sampleapis.com/coffee/${type}`)
    ).then(res => res.json());
  }
}

```

`middlewares.ts`

```typescript
import type { Middleware } from '@kodasoftware/api';

import type { AccountService, CoffeeService } from '../lib';

interface Account {
  transactionDate: string;
  description: string;
  category: string;
  debit: number | null;
  credit: number | null;
  id: number;
}

export function accountMiddlewareFactory(): Middleware<
  Account[],
  { account: AccountService }
> {
  return async function accountMiddleware(ctx) {
    ctx.body = await ctx.services.account.retrieveAccounts();
    ctx.status = 200;
  };
}

interface Coffee {
  title: string;
  description: string;
  ingredients: string[];
  image: string;
  id: number;
}

export function coffeeMiddlewareFactory(): Middleware<
  Coffee,
  { coffee: CoffeeService }
> {
  return async function exampleMiddleware(ctx) {
    const type = ctx.params.type as 'hot' | 'iced';
    ctx.body = await ctx.services.coffee.retrieveCoffee(type);
    ctx.status = 200;
  };
}

```

`routes.ts`

```typescript
import { Router, schemaMiddlewareFactory } from '@kodasoftware/api';

import { accountMiddlewareFactory, coffeeMiddlewareFactory } from '../middlewares';

/**
 * @openapi
 * /accounts:
 *  get:
 *    tags:
 *      - Account
 *    description: Retrieve bank accounts
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 */
export function accountRouteFactory() {
  const router = new Router();
  router.get('accounts', '/accounts', accountMiddlewareFactory());
  return router;
}

/**
 * @openapi
 * /coffee/{type}:
 *  post:
 *    tags:
 *      - Coffee
 *    description: Retrieve types of coffee
 *    parameters:
 *      - name: type
 *        in: path
 *        description: The type of coffee you want to retrieve
 *        required: true
 *        schema:
 *          type: string
 *          enum:
 *            - hot
 *            - iced
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 */
export function coffeeRouteFactory() {
  const router = new Router();
  router.post(
    'coffee',
    '/coffee/:type',
    schemaMiddlewareFactory({
      schema: {
        path: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['hot', 'iced'],
            },
          },
          required: ['type'],
        },
      },
      expose: true,
    }),
    coffeeMiddlewareFactory()
  );
  return router;
}

```

Enjoy!
