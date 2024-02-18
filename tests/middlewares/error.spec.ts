import { createMockContext } from '@kodasoftware/testing';
import Chance from 'chance';

import { errorMiddlewareFactory } from '@/middlewares';

const CHANCE = new Chance();
const NEXT = jest.fn();

describe('errorMiddlewre', () => {
  const throwFn = jest.fn();
  const errorMiddleware = errorMiddlewareFactory();
  let context: any;

  beforeEach(() => {
    context = createMockContext({ throw: throwFn }) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('When an error is thrown', () => {
    describe('And the error status and message is not set', () => {
      it('Then the error status is set to 500 with no message', async () => {
        NEXT.mockRejectedValue(new Error());

        await errorMiddleware(context, NEXT);

        expect(NEXT).toHaveBeenCalledTimes(1);
        expect(throwFn).toHaveBeenCalledWith(500);
      });
    });

    describe('And the error status is not set', () => {
      it('Then the error status is set to 500', async () => {
        const message = CHANCE.sentence();

        NEXT.mockRejectedValue(new Error(message));

        await errorMiddleware(context, NEXT);

        expect(NEXT).toHaveBeenCalledTimes(1);
        expect(throwFn).toHaveBeenCalledWith(500, message);
      });
    });

    describe('And the error status and message are set', () => {
      it('Then throws error status and message', async () => {
        const message = CHANCE.sentence();
        const status = CHANCE.natural({ min: 400, max: 599 });
        const error: any = new Error(message);
        error.status = status;

        NEXT.mockRejectedValue(error);

        await errorMiddleware(context, NEXT);

        expect(NEXT).toHaveBeenCalledTimes(1);
        expect(throwFn).toHaveBeenCalledWith(status, message);
      });
    });

    describe('And the error status, message and expose are set', () => {
      it('Then throws error status and message', async () => {
        const message = CHANCE.sentence();
        const status = CHANCE.natural({ min: 400, max: 599 });
        const error: any = new Error(message);
        error.status = status;
        error.expose = true;

        NEXT.mockRejectedValue(error);

        await errorMiddleware(context, NEXT);

        expect(NEXT).toHaveBeenCalledTimes(1);
        expect(throwFn).toHaveBeenCalledWith(status, message, error);
      });
    });
  });
});
