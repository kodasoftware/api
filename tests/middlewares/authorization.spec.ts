import { createMockContext } from '@kodasoftware/testing';
import { Chance } from 'chance';

import type { Middleware } from '@/@types';
import { authorizationMiddlewareFactory } from '@/middlewares';

const CHANCE = new Chance();
const NEXT = jest.fn();

describe('authorizationMiddleware', () => {
  let authorizationMiddleware: Middleware;
  let permission: string;

  beforeEach(() => {
    permission = CHANCE.word();
    authorizationMiddleware = authorizationMiddlewareFactory({
      permissions: { required: permission },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Given no auth set in state', () => {
    it('Then throws 401 status', async () => {
      const context = createMockContext() as any;
      await expect(authorizationMiddleware(context, NEXT)).rejects.toThrow(
        expect.objectContaining({
          status: 401,
          message: 'Unauthorized',
        })
      );
    });
  });

  describe('Given auth is set in state', () => {
    describe('When permissions are missing from auth', () => {
      it('Then throws 401 status', async () => {
        const context = createMockContext({
          state: { auth: { permissions: [CHANCE.word()] } },
        }) as any;
        await expect(authorizationMiddleware(context, NEXT)).rejects.toThrow(
          expect.objectContaining({
            status: 401,
            message: 'Unauthorized',
          })
        );
      });
    });

    describe('When permissions exist in auth', () => {
      it('Then next is called', async () => {
        const context = createMockContext({
          state: { auth: { permissions: [permission] } },
        }) as any;
        await expect(authorizationMiddleware(context, NEXT)).resolves.toEqual(
          undefined
        );
        expect(NEXT).toHaveBeenCalledTimes(1);
      });
    });
  });
});
