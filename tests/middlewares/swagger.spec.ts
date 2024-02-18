import { createMockContext } from '@kodasoftware/testing';
import { Chance } from 'chance';

import { swaggerMiddlewareFactory } from '@/middlewares';

const CHANCE = new Chance();
const NEXT = jest.fn();

describe('swaggerMiddleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('When path does not match docs path', () => {
    it('Then no swagger is served', async () => {
      const swaggerMiddleware = swaggerMiddlewareFactory({} as any);
      const context = createMockContext({ url: `/${CHANCE.word()}` }) as any;

      await swaggerMiddleware(context, NEXT);

      expect(NEXT).toHaveBeenCalledTimes(1);
    });
  });

  describe('When no opts provided', () => {
    it('Then Swagger UI should be served', async () => {
      const swaggerMiddleware = swaggerMiddlewareFactory({} as any);
      const context = createMockContext({ url: '/docs' }) as any;

      await swaggerMiddleware(context, NEXT);

      expect(NEXT).not.toHaveBeenCalled();
      expect(context.body).toEqual(expect.stringContaining('<!DOCTYPE html>'));
      expect(context.type).toEqual('text/html');
    });

    it('Then swagger spec should be served', async () => {
      const swaggerMiddleware = swaggerMiddlewareFactory({} as any);
      const context = createMockContext({ url: '/docs/spec' }) as any;

      await swaggerMiddleware(context, NEXT);

      expect(NEXT).not.toHaveBeenCalled();
      expect(context.body).toEqual(undefined);
    });
  });

  describe('When opts provided', () => {
    it('Then swagger should be served', async () => {
      const swaggerMiddleware = swaggerMiddlewareFactory({
        title: CHANCE.name(),
        spec: {},
      });
      const context = createMockContext({ url: '/docs' }) as any;

      await swaggerMiddleware(context, NEXT);

      expect(NEXT).not.toHaveBeenCalled();
      expect(context.body).toEqual(expect.stringContaining('<!DOCTYPE html>'));
      expect(context.type).toEqual('text/html');
    });

    it('Then swagger spec should be served', async () => {
      const spec = { paths: { '/': { get: { responses: { 200: {} } } } } };
      const swaggerMiddleware = swaggerMiddlewareFactory({
        title: CHANCE.name(),
        spec,
      });
      const context = createMockContext({ url: '/docs/spec' }) as any;

      await swaggerMiddleware(context, NEXT);

      expect(NEXT).not.toHaveBeenCalled();
      expect(context.body).toEqual(spec);
    });
  });
});
