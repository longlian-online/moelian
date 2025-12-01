import { useFetch } from '#imports';
import type { UseFetchOptions } from '#app';
import type { AsyncData } from 'nuxt/app';
import { useNuxtApp } from '#app';
import { ErrorMap } from '~/shared/errors';

// 定义接口，以便 TypeScript 知道返回的数据结构
// 响应业务逻辑错误的时候是没有data的
interface ApiResponse<T> {
	code: number;
	message: string;
	data?: T;
}

// 定义 useApiFetch 的类型签名
type ApiFetch = <T>(
	url: string,
	options?: UseFetchOptions<ApiResponse<T>>,
) => AsyncData<ApiResponse<T>, Error | null>;

// 导出 useApiFetch 函数
export const useApiFetch: ApiFetch = (url, options = {}) => {
	const { $tip } = useNuxtApp();
	const defaults = {
		onResponse: ({ response }) => {
			if (response._data && response._data.code !== 0) {
				if (response._data.code === ErrorMap['UNAUTHORIZED'].code) {
					return navigateTo('/login');
				}
				$tip(response._data.message, {
					color: 'error',
					icon: 'mdi-alert-circle',
				});
				throw new Error(response._data.message || '未知业务错误');
			}
		},
		onResponseError: ({ error }) => {
			const errorMessage = error?.message || '网络请求失败，请稍后重试。';
			$tip(errorMessage, { color: 'error', icon: 'mdi-alert-circle' });
			console.error('API 请求失败:', errorMessage);
		},
	};
	return useFetch(url, { ...defaults, ...options });
};
