import { deleteById } from "~/server/service/work";
import { PARAMS_ERROR } from "~/server/types/business_exception";

export default defineWrappedResponseHandler(async event => {
  const params = getRouterParams(event);
  const id = Number(params["id"]);
  if (!id) {
    throw new PARAMS_ERROR();
  }

  await deleteById(id);
});
