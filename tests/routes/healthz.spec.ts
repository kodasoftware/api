import Chance from 'chance';
import Koa from 'koa';
import request from 'supertest';

import { healthzRouteFactory } from '@/routes';

const CHANCE = new Chance();

describe('healthzRoute', () => {
  const callback = jest.fn();
  let app: Koa;

  beforeEach(() => {
    app = new Koa();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('When a request does not match path', () => {
    it('Then it returns 404', async () => {
      const endpoint = `/${CHANCE.word()}`;
      const router = healthzRouteFactory({ endpoint });
      app.use(router.attach());
      await expect(request(app.callback()).get('/')).resolves.toEqual(
        expect.objectContaining({ status: 404 })
      );
    });
  });

  describe('When a request does not match method', () => {
    it('Then it returns 405', async () => {
      const endpoint = `/${CHANCE.word()}`;
      const router = healthzRouteFactory({ endpoint });
      app.use(router.attach());
      await expect(request(app.callback()).post(endpoint)).resolves.toEqual(
        expect.objectContaining({ status: 405 })
      );
    });
  });

  describe('When a request matches', () => {
    it('And no config is provided then it returns 200', async () => {
      const endpoint = '/healthz';
      const router = healthzRouteFactory();
      app.use(router.attach());
      await expect(request(app.callback()).get(endpoint)).resolves.toEqual(
        expect.objectContaining({ status: 200 })
      );
    });

    it('Then it returns 200', async () => {
      const endpoint = `/${CHANCE.word()}`;
      const router = healthzRouteFactory({ endpoint });
      app.use(router.attach());
      await expect(request(app.callback()).get(endpoint)).resolves.toEqual(
        expect.objectContaining({ status: 200 })
      );
    });

    describe('And route has callback', () => {
      it('Then it returns 200 and no response when callback returns nothing', async () => {
        const endpoint = `/${CHANCE.word()}`;
        const router = healthzRouteFactory({ callback, endpoint });

        app.use(router.attach());
        callback.mockResolvedValue(null);

        await expect(request(app.callback()).get(endpoint)).resolves.toEqual(
          expect.objectContaining({ status: 200 })
        );
      });

      it('Then it returns 200 and callback response', async () => {
        const endpoint = `/${CHANCE.word()}`;
        const router = healthzRouteFactory({ callback, endpoint });
        const response = { foo: 'bar' };

        app.use(router.attach());
        callback.mockResolvedValue(response);

        await expect(request(app.callback()).get(endpoint)).resolves.toEqual(
          expect.objectContaining({ status: 200, body: response })
        );
      });
    });
  });
});
