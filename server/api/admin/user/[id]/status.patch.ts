import {getId} from "~/server/utils/handler";
import {updateUserStatus} from "~/server/service/user";
import {UpdateUserStatusReq} from "#shared/dto/admin/user";

export default defineWrappedResponseHandler(async (event)=>{
    const id = getId(event)

    const data = UpdateUserStatusReq.parse(await readBody(event))

    await updateUserStatus(id, data.status)
})
