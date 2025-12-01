import { updatePassword } from '~/server/service/user';
import { UpdatePasswordReq } from '~/shared/dto/admin/user';

export default defineWrappedResponseHandler(async (event) => {
	const userSession = await getUserSession(event);
	const data = UpdatePasswordReq.parse(await readBody(event));

	const newPassword = await updatePassword(
		userSession.user!.id,
		data.newPassword,
	);

	return {
		newPassword,
	};
});
