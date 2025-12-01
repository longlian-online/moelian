import { deleteById } from '~/server/service/chapter';
import { getId } from '~/server/utils/handler';

export default defineWrappedResponseHandler(async (event) => {
	const id = getId(event);

	await deleteById(id);
});
