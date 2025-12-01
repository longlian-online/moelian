import { listForAdmin } from "~/server/service/work";
import type {
  WorkAdminListItem,
  WorkAdminListRes,
} from "~/shared/dto/admin/work";
import { WorkAdminListReq } from "~/shared/dto/admin/work";
import { map, pick } from "radash";
import { getResourceURL } from '~/server/service/resource';
import { ResourceType } from "~/server/lib/prisma";

export default defineWrappedResponseHandler(
  async (event): Promise<WorkAdminListRes> => {
    const query = getQuery(event);
    const data = WorkAdminListReq.parse(query);
    const { list, total } = await listForAdmin({
      equals: {
        id: data.id,
        content_type: data.contentType,
        length_type: data.lengthType,
        status: data.status,
        type_id: data.typeId,
        serial_status: data.serialStatus,
      },
      like: {
        author: data.author,
        title: data.title,
      },
      pagination: {
        page: data.page,
        limit: data.limit,
      },
    });

    const baseUrl = useRuntimeConfig(event).storage.cos.url;
    return {
      total: total,
      list: await map(list, async (item): Promise<WorkAdminListItem> => {
        return {
          ...pick(item, [
            "id",
            "created_at",
            "author",
            "content_type",
            "length_type",
            "serial_status",
            "title",
            "status",
              'description',
              'biz_no'
          ]),
          cover: getResourceURL(item.Cover, baseUrl, ResourceType.Cover),
        };
      }),
    };
  }
);
