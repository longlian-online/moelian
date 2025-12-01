import { updateStatus } from "~/server/service/chapter";
import { ChapterStatusPatchReq } from "~/shared/dto/admin/chapter";
import { getId } from "~/server/utils/handler";

export default defineWrappedResponseHandler(async (event) => {
  const id = getId(event);
  const body = await readBody(event);
  const data = ChapterStatusPatchReq.parse(body);

  await updateStatus(id, data.status);
});
