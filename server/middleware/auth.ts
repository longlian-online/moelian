export default defineEventHandler(async (event) => {
	const path = event.path;
	const privateRoute: string[] = useRuntimeConfig(event).privateRoute;

	if (
		privateRoute.some((prefix: string) => {
			return path.startsWith(prefix);
		})
	) {
		const userSession = await getUserSession(event);
		if (!userSession.user) {
			return {
				code: 40001,
				message: '请先登录',
			};
		}
	}
});
