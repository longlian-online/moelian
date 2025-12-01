import { getContentByID } from "~/server/service/chapter"
import type { WorkContentRes } from "~/shared/dto/web/work";

export default defineWrappedResponseHandler(async (event): Promise<WorkContentRes> => {
    const id = getId(event)

    const baseUrl = useRuntimeConfig(event).storage.cos.url;
    return await getContentByID(id, baseUrl)
})