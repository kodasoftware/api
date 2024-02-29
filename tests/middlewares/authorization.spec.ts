import { createMockContext } from '@kodasoftware/testing';
import { Chance } from 'chance';

import {
  type AuthorizationMiddleware,
  authorizationMiddlewareFactory,
  type AuthService,
} from '@/middlewares';

const CHANCE = new Chance();
const NEXT = jest.fn();
const IS_AUTHORISED = jest.fn();

class MockAuthService implements AuthService {
  isAuthorised = IS_AUTHORISED;
}

describe('authorizationMiddleware', () => {
  let authorizationMiddleware: AuthorizationMiddleware;
  let permission: string;

  beforeEach(() => {
    permission = CHANCE.word();
    authorizationMiddleware = authorizationMiddlewareFactory({
      permission: { required: permission },
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
      describe('And auth service exists and returns false', () => {
        it('Then throws 401', async () => {
          const context = createMockContext({
            state: { auth: { permissions: [permission] } },
            customProperties: { services: { auth: new MockAuthService() } },
          }) as any;

          IS_AUTHORISED.mockResolvedValue(false);

          await expect(authorizationMiddleware(context, NEXT)).rejects.toThrow(
            expect.objectContaining({
              status: 401,
              message: 'Unauthorized',
            })
          );
        });
      });

      describe('And auth service exists and returns true', () => {
        it('Then next is called', async () => {
          const context = createMockContext({
            state: { auth: { permissions: [permission] } },
            customProperties: { services: { auth: new MockAuthService() } },
          }) as any;

          IS_AUTHORISED.mockResolvedValue(true);

          await expect(authorizationMiddleware(context, NEXT)).resolves.toEqual(
            undefined
          );
          expect(NEXT).toHaveBeenCalledTimes(1);
        });
      });

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
