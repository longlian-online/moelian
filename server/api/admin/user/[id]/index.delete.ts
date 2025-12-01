import {deleteUser} from '~/server/service/user'
import {getId} from "~/server/utils/handler";

export default defineWrappedResponseHandler(async (event)=>{
    const id = getId(event)

    await deleteUser(id)
})