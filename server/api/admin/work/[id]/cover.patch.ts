import { updateCover } from "~/server/service/work";
import { PARAMS_ERROR } from "~/server/types/business_exception";
import { WorkCoverPatchReq } from "~/shared/dto/admin/work";

export default defineWrappedResponseHandler(async event => {
  const params = getRouterParams(event);
  const id = Number(params["id"]);
  if (!id) {
    throw new PARAMS_ERROR();
  }

  const body = await readBody(event);
  const data = WorkCoverPatchReq.parse(body);

  await updateCover(id, data.coverId);
});
