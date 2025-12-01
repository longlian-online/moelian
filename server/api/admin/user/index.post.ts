import { adminCreate } from "~/server/service/user";
import type { CreateUserRes } from "~/shared/dto/admin/user";
import { CreateUserReq } from "~/shared/dto/admin/user";

export default defineWrappedResponseHandler(
  async (event): Promise<CreateUserRes> => {
    const body = await readBody(event);
    const data = CreateUserReq.parse(body);

    const user = await adminCreate(data);
    return {
      nickname: user.nickname,
      username: user.username,
      password: user.password
    };
  }
);
