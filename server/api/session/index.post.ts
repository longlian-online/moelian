import type { SessionCreateRes } from '#shared/dto/session';
import { SessionCreateReq } from '#shared/dto/session';
import { login } from '~/server/service/session';

export default defineWrappedResponseHandler(
	async (event): Promise<SessionCreateRes> => {
		const body = await readBody(event);
		const data = SessionCreateReq.parse(body);
		const baseUrl = useRuntimeConfig(event).storage.cos.url;

		const sessionInfo = await login({
			...data,
			cosBaseUrl: baseUrl,
		});

		await setUserSession(event, {
			user: sessionInfo
		})

		return sessionInfo
	},
);
