import { createMockContext } from '@kodasoftware/testing';

import { healthzMiddlewareFactory } from '@/middlewares';

const NEXT = jest.fn();

describe('healthzMiddleware', () => {
  const callback = jest.fn();

  describe('When no callback is provided', () => {
    it('Then returns 200 status', async () => {
      const context = createMockContext() as any;
      await healthzMiddlewareFactory()(context, NEXT);
      expect(context.status).toEqual(200);
    });
  });

  describe('When callback is provided', () => {
    it('Then throws error when callback errors', async () => {
      const context = createMockContext() as any;

      callback.mockRejectedValue(new Error());

      await expect(
        healthzMiddlewareFactory(callback)(context, NEXT)
      ).rejects.toThrow(Error);
      expect(callback).toHaveBeenCalledWith(context);
    });

    it('Then returns 200 status', async () => {
      const context = createMockContext() as any;
      const response = { foo: 'bar' };

      callback.mockResolvedValue(response);

      await healthzMiddlewareFactory(callback)(context, NEXT);
      expect(context.status).toEqual(200);
      expect(context.body).toEqual(response);
      expect(callback).toHaveBeenCalledWith(context);
    });
  });
});
