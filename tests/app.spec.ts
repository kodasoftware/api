import { getFunction } from '@google-cloud/functions-framework/testing';
import Chance from 'chance';
import { stringify } from 'querystring';
import { type Handler } from 'serverless-http';
import request from 'supertest';

import { Application, createApplication } from '@/app';

const CHANCE = new Chance();
const NAME = CHANCE.word();
const UUID = CHANCE.guid();
const NOW = CHANCE.date();

jest.mock('crypto', () => ({
  randomUUID: () => UUID,
}));
jest.useFakeTimers({ now: NOW });

describe('Application', () => {
  afterEach(() => jest.clearAllMocks());

  it('should construct an Application', () => {
    expect(createApplication({ config: { name: NAME } })).toBeInstanceOf(
      Application
    );
  });

  describe('Given an application', () => {
    const middleware = jest.fn();
    let app: Application;

    beforeAll(() => {
      app = createApplication({ config: { name: NAME } });
      app.use(middleware);
    });

    describe('When start is called', () => {
      afterEach(() => app.end());

      it('Then it should start a server', async () => {
        const port = CHANCE.natural({ min: 9000, max: 9090 });
        const body = { foo: CHANCE.string() };

        middleware.mockImplementation(ctx => {
          ctx.status = 200;
          ctx.body = body;
        });
        await app.start({ port });

        const response = await fetch(new URL('/', `http://localhost:${port}`));

        expect(response).toEqual(expect.objectContaining({ status: 200 }));
        await expect(response.json()).resolves.toEqual(body);
      });
    });

    describe('When serverless is called', () => {
      const body = { foo: CHANCE.string() };

      beforeAll(() => {
        middleware.mockImplementation(ctx => {
          ctx.status = 200;
          ctx.body = body;
        });
      });

      describe('And the provider is gcloud', () => {
        beforeAll(() => app.serverless({ provider: 'gcloud' }));

        it('Then creates a serverless function', async () => {
          const query = { foo: CHANCE.word() };
          const customHeaderValue = CHANCE.string();
          const serverlessFn = getFunction(NAME);

          expect(serverlessFn).not.toBeUndefined();

          const response = await request(serverlessFn as any)
            .get('/')
            .set('x-custom-header', customHeaderValue)
            .query(query);

          expect(response).toEqual(
            expect.objectContaining({
              status: 200,
              text: JSON.stringify(body),
              header: expect.objectContaining({
                'access-control-allow-origin': '*',
                connection: 'close',
                'content-type': 'application/json; charset=utf-8',
                vary: 'Origin',
                'x-correlation-id': UUID,
              }),
            })
          );
          expect(middleware).toHaveBeenCalledTimes(1);
          expect(middleware).toHaveBeenCalledWith(
            expect.objectContaining({
              request: expect.objectContaining({
                header: expect.objectContaining({
                  'x-custom-header': customHeaderValue,
                }),
                method: 'GET',
                url: `/?${stringify(query)}`,
                query: expect.objectContaining(query),
              }),
              query: expect.objectContaining(query),
              response: expect.objectContaining({
                header: expect.objectContaining({
                  'access-control-allow-origin': '*',
                  'content-type': 'application/json; charset=utf-8',
                  vary: 'Origin',
                  'x-correlation-id': UUID,
                }),
                message: 'OK',
                status: 200,
              }),
            }),
            expect.any(Function)
          );
        });
      });

      describe('And the provider is aws', () => {
        let serverlessFn: Handler;

        beforeAll(async () => {
          serverlessFn = (await app.serverless({ provider: 'aws' })) as Handler;
        });

        it('Then creates a serverless function', async () => {
          const request = {
            httpMethod: 'GET',
            path: '/',
            queryStringParameters: {
              param: CHANCE.word(),
            },
          };
          const context = { awsRequestId: UUID };
          const response = await serverlessFn(request, context);

          expect(response).toEqual(
            expect.objectContaining({
              statusCode: 200,
              body: JSON.stringify(body),
              headers: expect.objectContaining({
                'access-control-allow-origin': '*',
                'content-type': 'application/json; charset=utf-8',
                vary: 'Origin',
                'x-correlation-id': UUID,
              }),
            })
          );
          expect(middleware).toHaveBeenCalledTimes(1);
          expect(middleware).toHaveBeenCalledWith(
            expect.objectContaining({
              request: expect.objectContaining({
                header: expect.objectContaining({ 'x-correlation-id': UUID }),
                method: 'GET',
                url: `/?${stringify(request.queryStringParameters)}`,
                query: expect.objectContaining(request.queryStringParameters),
              }),
              query: expect.objectContaining(request.queryStringParameters),
              response: expect.objectContaining({
                header: expect.objectContaining({
                  'access-control-allow-origin': '*',
                  'content-type': 'application/json; charset=utf-8',
                  vary: 'Origin',
                  'x-correlation-id': UUID,
                }),
                message: 'OK',
                status: 200,
              }),
            }),
            expect.any(Function)
          );
        });
      });

      describe('And the provider is azure', () => {
        let serverlessFn: Handler;

        beforeAll(async () => {
          serverlessFn = (await app.serverless({
            provider: 'azure',
          })) as Handler;
        });

        it('Then creates a serverless function', async () => {
          const context = { log: jest.fn() };
          const request = {
            method: 'GET',
            url: '/',
            headers: { 'x-custom-header': CHANCE.string() },
            rawBody: JSON.stringify({ foo: CHANCE.word() }),
            query: { foo: CHANCE.word() },
          };
          const response = await serverlessFn(context, request);

          expect(response).toEqual(
            expect.objectContaining({
              status: 200,
              body: JSON.stringify(body),
              headers: expect.objectContaining({
                'access-control-allow-origin': '*',
                'content-type': 'application/json; charset=utf-8',
                vary: 'Origin',
                'x-correlation-id': UUID,
              }),
            })
          );
          expect(middleware).toHaveBeenCalledTimes(1);
          expect(middleware).toHaveBeenCalledWith(
            expect.objectContaining({
              request: expect.objectContaining({
                header: expect.objectContaining(request.headers),
                method: 'GET',
                url: `/?${stringify(request.query)}`,
                query: expect.objectContaining(request.query),
              }),
              query: expect.objectContaining(request.query),
              response: expect.objectContaining({
                header: expect.objectContaining({
                  'access-control-allow-origin': '*',
                  'content-type': 'application/json; charset=utf-8',
                  vary: 'Origin',
                  'x-correlation-id': UUID,
                }),
                message: 'OK',
                status: 200,
              }),
            }),
            expect.any(Function)
          );
        });
      });
    });
  });

  describe('Given an application with swagger', () => {
    const middleware = jest.fn();
    let app: Application;

    beforeAll(() => {
      app = createApplication({
        config: { name: NAME },
        swagger: { spec: {} },
      });
      app.use(middleware);
    });

    it('should return swagger UI', async () => {
      await expect(request(app.callback()).get('/docs')).resolves.toEqual(
        expect.objectContaining({
          status: 200,
          header: expect.objectContaining({
            'access-control-allow-origin': '*',
            connection: 'close',
            'content-type': 'text/html; charset=utf-8',
            vary: 'Origin',
            'x-correlation-id': UUID,
          }),
          text: expect.stringContaining('<!DOCTYPE html>'),
        })
      );
    });

    it('should return swagger spec', async () => {
      await expect(request(app.callback()).get('/docs/spec')).resolves.toEqual(
        expect.objectContaining({
          status: 200,
          header: expect.objectContaining({
            'access-control-allow-origin': '*',
            connection: 'close',
            'content-type': 'application/json; charset=utf-8',
            vary: 'Origin',
            'x-correlation-id': UUID,
          }),
          body: { definition: { info: { title: NAME } } },
        })
      );
    });
  });
});
