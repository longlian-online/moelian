import type { BusinessErrorDefinition, KeyOfErrorMap } from '~~/shared/errors';
import { ErrorMap } from '~~/shared/errors';

/**
 * 业务异常类
 */
export class BusinessException extends Error {
	constructor(
		public readonly code: number,
		public override readonly message: string,
	) {
		super(message);
	}
}

type ExceptionConstructor = new () => BusinessException;

function createExceptionClass<T extends BusinessErrorDefinition>(
	def: T,
): ExceptionConstructor {
	return class extends BusinessException {
		constructor() {
			super(def.code, def.message);
		}
	};
}

type GeneratedExceptions = {
	[K in KeyOfErrorMap]: ExceptionConstructor;
};

const exceptions = {} as GeneratedExceptions;

(
	Object.entries(ErrorMap) as [KeyOfErrorMap, BusinessErrorDefinition][]
).forEach(([key, def]) => {
	exceptions[key] = createExceptionClass(def);
});

export const {
	UNAUTHORIZED,
	USERNAME_OR_PASSWORD_ERROR,
	PARAMS_ERROR,
	TITLE_REPEAT,
	USER_DISABLE,
	USERNAME_REPEAT,
	DATA_NOT_EXISTS,
	RESOURCE_NOT_READY,
	SYSTEM_ERROR,
	WORK_HAS_CHAPTER,
	UNAUTHORIZED_OPERATION,
	TAG_HAS_WORK,
	TAG_REPEAT,
	TAG_NOT_EXISTS,
} = exceptions;
