import { generateToken, MockJwks } from '@kodasoftware/testing';
import { createMockContext } from '@kodasoftware/testing';
import { mockJwksEndpoint } from '@kodasoftware/testing';
import Chance from 'chance';
// eslint-disable-next-line node/no-extraneous-import
import nock from 'nock';

import type { Middleware } from '@/@types';
import { authenticationMiddlewareFactory } from '@/middlewares';

const CHANCE = new Chance();
const NEXT = jest.fn();
const UNAUTHORIZED_ERROR = { status: 401 };

describe('authenticationMiddleware', () => {
  let jwksUri: string;
  let authenticationMiddleware: Middleware;
  let jwks: MockJwks;

  beforeEach(() => {
    jwksUri = CHANCE.url();
    authenticationMiddleware = authenticationMiddlewareFactory({ jwksUri });
    jwks = new MockJwks({ uri: jwksUri });
  });

  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  describe('Given an authentication middleware', () => {
    describe('When an authorization header does not exist', () => {
      it('Then throw 401 error', async () => {
        const context = createMockContext() as any;
        await expect(authenticationMiddleware(context, NEXT)).rejects.toThrow(
          expect.objectContaining({
            ...UNAUTHORIZED_ERROR,
            message: 'Unauthorized',
          })
        );
      });
    });

    describe('When an invalid authorization header is provided', () => {
      it.each([CHANCE.word(), ` ${CHANCE.word()}`])(
        'Then throws 401 error when header is %s',
        async value => {
          const context = createMockContext({
            headers: { Authorization: value },
          }) as any;
          await expect(authenticationMiddleware(context, NEXT)).rejects.toThrow(
            expect.objectContaining({
              ...UNAUTHORIZED_ERROR,
              message:
                value.startsWith(' ') || value.indexOf(' ') > 0
                  ? 'Invalid authorization header'
                  : 'No authorization token provided',
            })
          );
        }
      );

      it('Then throws 401 error when invalid token provided', async () => {
        const context = createMockContext({
          headers: { Authorization: `${CHANCE.word()} ${CHANCE.word()}` },
        }) as any;
        await expect(authenticationMiddleware(context, NEXT)).rejects.toThrow(
          expect.objectContaining({
            ...UNAUTHORIZED_ERROR,
            message: 'Invalid token provided',
          })
        );
      });

      it('Then throws 401 error when JWT missing client identifier', async () => {
        const { privateKey } = jwks.generateKeys();
        const token = generateToken({
          payload: { permissions: [] },
          privateKey,
          algorithm: 'RS256',
        });
        const context = createMockContext({
          headers: { Authorization: `Bearer ${token}` },
        }) as any;
        await expect(authenticationMiddleware(context, NEXT)).rejects.toThrow(
          expect.objectContaining({
            ...UNAUTHORIZED_ERROR,
            message: 'Invalid token provided',
          })
        );
      });
    });

    describe('When an jwks client cannot verify token', () => {
      it('Then throws 401 error when jwks client cannot retrieve signing key', async () => {
        const { privateKey } = jwks.generateKeys();
        const token = generateToken({
          payload: { permissions: [] },
          privateKey,
          algorithm: 'RS256',
          header: {
            kid: CHANCE.string({ symbols: false, numeric: false }),
            alg: 'RS256',
          },
        });
        const context = createMockContext({
          headers: { Authorization: `Bearer ${token}` },
        }) as any;
        await expect(authenticationMiddleware(context, NEXT)).rejects.toThrow(
          expect.objectContaining({
            ...UNAUTHORIZED_ERROR,
            message: 'Could not retrieve signing key',
          })
        );
      });

      it('Then throws 401 error when public key is empty', async () => {
        const { privateKey, jwks: jwk } = jwks.generateKeys();
        const token = generateToken({
          payload: { permissions: [] },
          privateKey,
          algorithm: 'RS256',
          header: {
            kid: CHANCE.string({ symbols: false, numeric: false }),
            alg: 'RS256',
          },
        });
        const context = createMockContext({
          headers: { Authorization: `Bearer ${token}` },
        }) as any;

        mockJwksEndpoint({
          endpoint: new URL(jwksUri),
          kid: CHANCE.string({ symbols: false, numeric: false }),
          jwks: jwk,
        });

        await expect(authenticationMiddleware(context, NEXT)).rejects.toThrow(
          expect.objectContaining({
            ...UNAUTHORIZED_ERROR,
            message: 'Could not retrieve signing key',
          })
        );
      });

      it('Then throws 401 error when token is cannot be verified', async () => {
        const kid = CHANCE.word();
        const { privateKey } = jwks.generateKeys();
        const { jwks: jwk } = jwks.generateKeys();
        const token = generateToken({
          payload: { permissions: [] },
          privateKey,
          algorithm: 'RS256',
          header: { kid, alg: 'RS256' },
        });
        const context = createMockContext({
          headers: { Authorization: `Bearer ${token}` },
        }) as any;

        mockJwksEndpoint({
          endpoint: new URL(jwksUri),
          kid,
          jwks: jwk,
        });

        await expect(authenticationMiddleware(context, NEXT)).rejects.toThrow(
          expect.objectContaining({
            ...UNAUTHORIZED_ERROR,
            message: 'Unauthorized',
          })
        );
      });
    });

    describe('When jwks client verified token', () => {
      it('Then the next middleware is called and auth exists in state', async () => {
        const kid = CHANCE.word();
        const payload = {
          id: CHANCE.guid(),
          name: CHANCE.name(),
          permissions: [],
        };
        const { privateKey, jwks: jwk } = jwks.generateKeys();
        const token = generateToken({
          payload,
          privateKey,
          algorithm: 'RS256',
          header: { kid, alg: 'RS256' },
        });
        const context = createMockContext({
          headers: { Authorization: `Bearer ${token}` },
        }) as any;

        mockJwksEndpoint({
          endpoint: new URL(jwksUri),
          kid,
          jwks: jwk,
        });

        await expect(authenticationMiddleware(context, NEXT)).resolves.toEqual(
          undefined
        );

        expect(NEXT).toHaveBeenCalledTimes(1);
        expect(context.state).toEqual({
          auth: expect.objectContaining(payload),
        });
      });
    });

    describe('When auth exists in state', () => {
      it('Then the next middleware is called', async () => {
        const context = createMockContext({
          state: { auth: { permissions: [] } },
        }) as any;
        await authenticationMiddleware(context, NEXT);

        expect(NEXT).toHaveBeenCalledTimes(1);
      });
    });
  });
});
