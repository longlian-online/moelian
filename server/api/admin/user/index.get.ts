import type {UserAdminListItem, UserAdminListRes} from "#shared/dto/admin/user";
import { UserAdminListReq} from "#shared/dto/admin/user";
import {listForAdmin} from "~/server/service/user";
import {map, omit} from "radash";
import {getResourceURLByID} from "~/server/service/resource";
import { ResourceType } from "~/server/lib/prisma";

export default defineWrappedResponseHandler(async (event): Promise<UserAdminListRes> => {
    const query = UserAdminListReq.parse(getQuery(event))

    const {list, total} = await listForAdmin({
        equals: {
            role: query.role,
            status: query.status,
            id: query.id,
        }, like: {
            nickname: query.nickname,
            username: query.username
        }, pagination: {
            page: query.page,
            limit: query.limit
        }
    })

    const baseUrl = useRuntimeConfig(event).storage.cos.url;
    return {
        list: await map(list, async (item):Promise<UserAdminListItem>=>{
            return {
                ...omit(item, ['updated_at', 'deleted_at', 'password', 'avatar_id']),
                avatar: await getResourceURLByID(item.avatar_id, baseUrl, ResourceType.Avatar)
            }
        }),
        total,
    }
})