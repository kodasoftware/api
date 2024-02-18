import { createMockContext } from '@kodasoftware/testing';
import { Chance } from 'chance';
import { readFileSync } from 'fs';

import { schemaMiddlewareFactory } from '@/middlewares';

const CHANCE = new Chance();
const THROW = jest.fn();
const NEXT = jest.fn();
const file = readFileSync('package.json', { encoding: 'base64' });

describe('schemaMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    {},
    { customProperties: { query: { number: CHANCE.natural({ max: 10 }) } } },
    {
      customProperties: {
        query: { foo: 'bar', number: CHANCE.natural({ min: 25 }) },
      },
    },
  ])('When invalid request query received', (request: any) => {
    it('Then returns 400 status', async () => {
      const context = createMockContext({ throw: THROW, ...request }) as any;
      const schemaMiddleware = schemaMiddlewareFactory({
        schema: {
          query: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              number: { type: 'number', maximum: 10 },
            },
            required: ['foo'],
          },
        },
        opts: { strict: true },
      });

      await schemaMiddleware(context, NEXT);

      expect(THROW).toHaveBeenCalledWith(400, 'Bad Request');
    });
  });

  describe.each([
    { customProperties: { params: {} } },
    { customProperties: { params: { id: CHANCE.guid() } } },
    {
      customProperties: {
        params: { id: CHANCE.guid(), animal: CHANCE.word() },
      },
    },
  ])('When invalid request path received', (request: any) => {
    it('Then returns 400 status', async () => {
      const context = createMockContext({ throw: THROW, ...request }) as any;
      const schemaMiddleware = schemaMiddlewareFactory({
        schema: {
          path: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              animal: { type: 'string', enum: ['dog', 'cat', 'horse'] },
            },
            required: ['animal', 'id'],
          },
        },
        opts: { strict: true },
      });

      await schemaMiddleware(context, NEXT);

      expect(THROW).toHaveBeenCalledWith(400, 'Bad Request');
    });
  });

  describe.each([
    { requestBody: {} },
    { requestBody: { id: CHANCE.guid() } },
    { requestBody: { id: CHANCE.guid(), animal: CHANCE.word() } },
  ])('When invalid request body received', (request: any) => {
    it('Then returns 400 status', async () => {
      const context = createMockContext({ throw: THROW, ...request }) as any;
      const schemaMiddleware = schemaMiddlewareFactory({
        schema: {
          body: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              animal: { type: 'string', enum: ['dog', 'cat', 'horse'] },
            },
            required: ['animal', 'id'],
          },
        },
        opts: { strict: true },
      });

      await schemaMiddleware(context, NEXT);

      expect(THROW).toHaveBeenCalledWith(400, 'Bad Request');
    });
  });

  describe.each([
    { headers: {} },
    { headers: { authorization: CHANCE.guid() } },
    {
      headers: { authorization: CHANCE.guid(), 'content-type': CHANCE.word() },
    },
  ])('When invalid request headers received', (request: any) => {
    it('Then returns 400 status', async () => {
      const context = createMockContext({ throw: THROW, ...request }) as any;
      const schemaMiddleware = schemaMiddlewareFactory({
        schema: {
          headers: {
            type: 'object',
            properties: {
              authorization: { type: 'string', pattern: '^Bearer (.*)$' },
              'content-type': {
                type: 'string',
                enum: ['application/json', 'text/html'],
              },
            },
            required: ['authorization', 'content-type'],
          },
        },
        opts: { strict: true },
      });

      await schemaMiddleware(context, NEXT);

      expect(THROW).toHaveBeenCalledWith(400, 'Bad Request');
    });
  });

  describe.each([
    { customProperties: { files: {} } },
    { customProperties: { files: { avatar: CHANCE.guid() } } },
    { customProperties: { files: { avatar: CHANCE.string() } } },
  ])('When invalid request headers received', (request: any) => {
    it('Then returns 400 status', async () => {
      const context = createMockContext({ throw: THROW, ...request }) as any;
      const schemaMiddleware = schemaMiddlewareFactory({
        schema: {
          files: {
            type: 'object',
            properties: { avatar: { type: 'string', format: 'byte' } },
            required: ['avatar'],
          },
        },
        opts: { strict: true },
      });

      await schemaMiddleware(context, NEXT);

      expect(THROW).toHaveBeenCalledWith(400, 'Bad Request');
    });
  });

  describe.each([
    {
      requestBody: {
        id: CHANCE.guid(),
        animal: CHANCE.pickone(['dog', 'cat', 'horse']),
      },
      headers: {
        authorization: `Bearer ${CHANCE.guid()}`,
        'content-type': CHANCE.pickone(['application/json', 'text/html']),
      },
      customProperties: {
        query: { foo: CHANCE.word() },
        params: {
          id: CHANCE.guid(),
          animal: CHANCE.pickone(['dog', 'cat', 'horse']),
        },
      },
    },
  ])('When valid request received', (request: any) => {
    it('Then returns calls upstream middleware', async () => {
      const context = createMockContext({ throw: THROW, ...request }) as any;
      const schemaMiddleware = schemaMiddlewareFactory({
        schema: {
          query: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              number: { type: 'number', maximum: 10 },
            },
            required: ['foo'],
          },
          path: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              animal: { type: 'string', enum: ['dog', 'cat', 'horse'] },
            },
            required: ['animal', 'id'],
          },
          body: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              animal: { type: 'string', enum: ['dog', 'cat', 'horse'] },
            },
            required: ['animal', 'id'],
          },
          headers: {
            type: 'object',
            properties: {
              authorization: { type: 'string', pattern: '^Bearer (.*)$' },
              'content-type': {
                type: 'string',
                enum: ['application/json', 'text/html'],
              },
            },
            required: ['authorization', 'content-type'],
          },
        },
        opts: { strict: true },
      });

      await schemaMiddleware(context, NEXT);

      expect(THROW).not.toHaveBeenCalled();
      expect(NEXT).toHaveBeenCalledTimes(1);
    });
  });

  describe.each([
    {
      customProperties: {
        request: { files: { avatar: file } },
      },
    },
  ])('When valid files received', (request: any) => {
    it('Then returns calls upstream middleware', async () => {
      const context = createMockContext({ throw: THROW, ...request }) as any;
      const schemaMiddleware = schemaMiddlewareFactory({
        schema: {
          files: {
            type: 'object',
            properties: { avatar: { type: 'string', format: 'byte' } },
            required: ['avatar'],
          },
        },
        opts: { strict: true },
      });

      await schemaMiddleware(context, NEXT);

      expect(THROW).not.toHaveBeenCalled();
      expect(NEXT).toHaveBeenCalledTimes(1);
    });
  });
});
