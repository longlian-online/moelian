import {getId} from "~/server/utils/handler";
import {resetUserPassword} from "~/server/service/user";
import type {ResetPasswordRes} from "#shared/dto/admin/user";

export default defineWrappedResponseHandler(async (event): Promise<ResetPasswordRes>=>{
    const id = getId(event)

    const newPassword = await resetUserPassword(id)

    return {
        newPassword
    }
})
