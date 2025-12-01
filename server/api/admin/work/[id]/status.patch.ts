import { updateStatus } from "~/server/service/work";
import { PARAMS_ERROR } from "~/server/types/business_exception";
import { WorkStatusPatchReq } from "~/shared/dto/admin/work";

export default defineWrappedResponseHandler(async event => {
  const params = getRouterParams(event);
  const id = Number(params["id"]);
  if (!id) {
    throw new PARAMS_ERROR();
  }

  const body = await readBody(event);
  const data = WorkStatusPatchReq.parse(body);

  await updateStatus(id, data.status);
});
