export interface BusinessErrorDefinition {
	code: number;
	message: string;
}

export const ErrorMap = {
	USERNAME_OR_PASSWORD_ERROR: {
		code: 10001,
		message: '账号或密码错误',
	},
	UNAUTHORIZED: {
		code: 40001,
		message: '未授权访问',
	},
	PARAMS_ERROR: {
		code: 40002,
		message: '参数异常',
	},
	USER_DISABLE: {
		code: 40003,
		message: '用户已被禁用',
	},
	SYSTEM_ERROR: {
		code: 50000,
		message: '系统内部异常',
	},
	TITLE_REPEAT: {
		code: 40003,
		message: '标题重复',
	},
	USERNAME_REPEAT: {
		code: 40004,
		message: '用户名重复',
	},
	DATA_NOT_EXISTS: {
		code: 40005,
		message: '数据不存在',
	},
	RESOURCE_NOT_READY: {
		code: 40006,
		message: '相关资源未准备好',
	},
	WORK_HAS_CHAPTER: {
		code: 40007,
		message: '该作品下存在章节，无法删除',
	},
	UNAUTHORIZED_OPERATION: {
		code: 40008,
		message: '无权操作',
	},
	TAG_HAS_WORK: {
		code: 40009,
		message: '该标签下存在章节，无法删除',
	},
	TAG_REPEAT: {
		code: 40010,
		message: '标签重复',
	},
	TAG_NOT_EXISTS: {
		code: 40011,
		message: '标签不存在',
	},
} as const satisfies Record<string, BusinessErrorDefinition>;

export type KeyOfErrorMap = keyof typeof ErrorMap;

export type ErrorCode = (typeof ErrorMap)[KeyOfErrorMap]['code'];
