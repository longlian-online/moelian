import { defineStore } from 'pinia';
import type { SessionCreateRes } from '~/shared/dto/session';
import { useApiFetch } from '~/utils/apiFetch';
import { useCookie } from '#app';

export const useAuthStore = defineStore('auth', () => {
	// 指定 Cookie 类型为 SessionCreateRes | null
	const userCookie = useCookie<SessionCreateRes | null>('user', {
		// 默认值
		default: null,
	});

	const user = ref<SessionCreateRes | null>(userCookie.value);

	const login = async (username: string, password: string) => {
		const { data, error } = await useApiFetch<SessionCreateRes>(
			'/api/session',
			{
				method: 'POST',
				body: { username, password },
			},
		);

		if (error.value) return false;

		if (data.value?.data) {
			user.value = data.value.data;
			userCookie.value = user.value;
		}
		return true;
	};

	const logout = async () => {
		await useApiFetch('/api/session', { method: 'DELETE' });
		user.value = null;
		userCookie.value = null;
	};

	const isLoggedIn = computed(() => !!user.value);

	return { user, login, logout, isLoggedIn };
});
