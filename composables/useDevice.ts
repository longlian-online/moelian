// composables/useDevice.ts
import { useRequestHeaders } from '#app';

/**
 * useDevice - 检测当前访问设备是移动端还是桌面端
 *
 * 原理：
 * - 在服务端渲染 (SSR) 阶段：通过请求头里的 user-agent 判断
 * - 在客户端渲染 (CSR) 阶段：通过浏览器的 navigator.userAgent 判断
 *
 * 返回值：
 * - isMobile: 是否为移动端
 */
export function useDevice() {
	let isMobile = false;

	// SSR 环境（在服务端执行时）
	if (import.meta.server) {
		// 只取 user-agent 头信息
		const headers = useRequestHeaders(['user-agent']);
		const ua = headers['user-agent'] || '';
		// 通过正则匹配判断是否是移动设备
		isMobile = /mobile|android|iphone|ipad/i.test(ua);

		// CSR 环境（在浏览器客户端执行时）
	} else if (import.meta.client) {
		// 直接通过浏览器提供的 userAgent 判断
		isMobile = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
	}

	return {
		isMobile,
	};
}
