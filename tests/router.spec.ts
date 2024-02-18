import Chance from 'chance';
import Koa from 'koa';
import request from 'supertest';

import { Router } from '@/router';

const CHANCE = new Chance();
const METHODS: Method[] = ['get', 'post', 'put', 'patch', 'delete'];

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

describe('Router', () => {
  const middleware = jest.fn();
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each(METHODS)(
    'Given a Router is configured with %s method',
    (method: Method) => {
      let app: Koa;
      let router: Router;
      let path: string;

      beforeEach(() => {
        app = new Koa();
        router = new Router();
        path = `/${CHANCE.string({ alpha: true, numeric: false, symbols: false })}`;
        router[method](CHANCE.name(), path, middleware);
        app.use(router.attach());
      });

      describe('When a path that does not match is provided', () => {
        it('Then it will return 404 status', async () => {
          await expect(
            request(app.callback())[method](
              `/${CHANCE.string({ alpha: true, numeric: false, symbols: false })}`
            )
          ).resolves.toEqual(expect.objectContaining({ status: 404 }));
        });
      });

      describe.each(METHODS.filter(_method => _method !== method))(
        'When %s method is provided',
        _method => {
          it('Then it will return 405 status', async () => {
            await expect(
              request(app.callback())[_method](path)
            ).resolves.toEqual(expect.objectContaining({ status: 405 }));
          });
        }
      );

      describe(`When ${method} method and ${path!} path is provided`, () => {
        it('Then it will return call the attached middleware and return 200 status', async () => {
          middleware.mockImplementation(ctx => {
            ctx.status = 200;
          });
          await expect(request(app.callback())[method](path)).resolves.toEqual(
            expect.objectContaining({ status: 200 })
          );
          expect(middleware).toHaveBeenCalledTimes(1);
        });
      });
    }
  );
});
