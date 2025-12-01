import bcrypt from 'bcrypt';
import * as dao from '~/server/repository/user'
import { USER_DISABLE, USERNAME_OR_PASSWORD_ERROR } from '~~/server/types/business_exception';
import { Status } from '_db'
import { getResourceURL } from './resource';
import { ResourceType } from '../lib/prisma';

export async function login(data: { username: string; password: string, cosBaseUrl: string }) {

  const user = await dao.findUserByUsernameWithAvatar(data.username)
  if (!user) {
    throw new USERNAME_OR_PASSWORD_ERROR();
  }

  // 验证密码
  const matched = bcrypt.compareSync(data.password, user.password);
  if (!matched) {
    throw new USERNAME_OR_PASSWORD_ERROR();
  }

  // 检查用户状态
  if (user.status === Status.Disable) {
    throw new USER_DISABLE();
  }

  // 设置用户会话
  return {
    id: user.id,
    nickname: user.nickname,
    avatar: getResourceURL(user.Avatar, data.cosBaseUrl, ResourceType.Avatar),
    role: user.role,
  };
}
