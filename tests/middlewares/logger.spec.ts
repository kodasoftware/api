import Chance from 'chance';

const CHANCE = new Chance();
const UUID = CHANCE.guid();
jest.mock('crypto', () => ({ randomUUID: () => UUID }));

import { createLogger } from '@kodasoftware/monitoring';
import { createMockContext } from '@kodasoftware/testing';

import { loggerMiddlewareFactory } from '@/middlewares/logger';

const LOGGER = createLogger({ name: CHANCE.name(), logLevel: 'trace' });
const NEXT = jest.fn();
const SET = jest.fn();
const NOW = new Date();

jest.useFakeTimers({ now: NOW });

describe('loggerMiddleware', () => {
  const loggerMiddleware = loggerMiddlewareFactory();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('When upstream middleware throws an error', () => {
    it('Then logs the error', async () => {
      const child = jest.fn();
      const error = jest.fn();
      const context = createMockContext({
        customProperties: { log: { child, error }, set: SET },
      }) as any;
      const message = CHANCE.sentence();

      child.mockImplementation(() => ({ error }));
      NEXT.mockRejectedValue(new Error(message));

      await loggerMiddleware(context, NEXT);

      expect(NEXT).toHaveBeenCalledTimes(1);
      expect(SET).toHaveBeenCalledWith('x-correlation-id', UUID);
      expect(error).toHaveBeenCalledWith(new Error(message), message, {
        status: 500,
        duration: 0,
      });
    });
  });

  describe('When upstream middleware resolves', () => {
    it('Then logs the request', async () => {
      const child = jest.fn();
      const info = jest.fn();
      const status = CHANCE.natural({ min: 200, max: 399 });
      const context = createMockContext({
        customProperties: { log: { child, info }, set: SET, status },
      }) as any;

      child.mockImplementation(() => ({ info }));
      NEXT.mockResolvedValue(null);

      await loggerMiddleware(context, NEXT);

      expect(NEXT).toHaveBeenCalledTimes(1);
      expect(SET).toHaveBeenCalledWith('x-correlation-id', UUID);
      expect(info).toHaveBeenCalledWith({ status, duration: 0 });
    });
  });

  describe('When no x-correlation-id header set', () => {
    it('Then generates a correlation id and sets state and response header', async () => {
      const context = createMockContext({
        customProperties: { log: LOGGER, set: SET },
      }) as any;
      await loggerMiddleware(context, NEXT);
      expect(context.state.correlationId).toEqual(UUID);
      expect(SET).toHaveBeenCalledWith('x-correlation-id', UUID);
      expect(NEXT).toHaveBeenCalledTimes(1);
    });
  });

  describe('When x-correlation-id header set', () => {
    it('Then sets the correlation id into state and response header', async () => {
      const uuid = CHANCE.guid();
      const context = createMockContext({
        headers: { 'x-correlation-id': uuid },
        customProperties: { log: LOGGER, set: SET },
      }) as any;
      await loggerMiddleware(context, NEXT);
      expect(context.state.correlationId).toEqual(uuid);
      expect(SET).toHaveBeenCalledWith('x-correlation-id', uuid);
      expect(NEXT).toHaveBeenCalledTimes(1);
    });
  });
});
