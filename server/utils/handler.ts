import type {EventHandler, EventHandlerRequest, H3Event} from 'h3';
import {BusinessException, PARAMS_ERROR} from '../types/business_exception';
import { ErrorMap } from '~~/shared/errors';
import { ZodError } from 'zod';
import logger from "~/server/lib/winston";

export const defineWrappedResponseHandler = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>
): EventHandler<T, D> =>
  defineEventHandler<T>(async (event) => {
    try {
      const response = await handler(event);
      return camelize({
				code: 0,
				message: 'OK',
				data: response,
			});
    } catch (err) {
      logger.error(err)
      if (err instanceof ZodError) {
        return {
          code: 1,
          message: err.issues[0].message,
        }
      }
      if (err instanceof BusinessException) {
        return {
          code: err.code,
          message: err.message,
        }
      }

      if (err instanceof Error) {
        logger.error(err.message)
      }
        const { code, message } = ErrorMap.SYSTEM_ERROR
        return {
          code,
          message
        }

    }
  });

export const getId = (event: H3Event) =>{
  const params = getRouterParams(event);
  const id = Number(params["id"]);
  if (!id) {
    throw new PARAMS_ERROR();
  }
  return id
}
const toCamelCase = (str: string) =>
	str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const camelize = (data: unknown): unknown => {
	if (Array.isArray(data)) {
		return data.map(camelize);
	}
	if (data !== null && typeof data === 'object') {
		return Object.fromEntries(
			Object.entries(data).map(([key, value]) => [
				toCamelCase(key),
				camelize(value)
			]),
		);
	}
	return data;
};
