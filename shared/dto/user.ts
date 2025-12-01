import z from 'zod';

const UsernameSchema = z.string().min(6, '用户名不能少于6个字符').max(18, '用户名不能多于18个字符')
    .regex(/^[a-zA-Z_]+$/, '密码只能包含字母、数字和点号（.），不能包含其他特殊字符');
const NicknameSchema = z.string().min(2, '昵称不能少于2个字符').max(18, '昵称不能多于18个字符');
const PasswordSchema = z.string().min(6, '密码不能少于6个字符').max(16, '密码不能多于18个字符')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字')
  .regex(/^[a-zA-Z0-9.]+$/, '密码只能包含字母、数字和点号（.），不能包含其他特殊字符')

export {
  UsernameSchema,
  NicknameSchema,
  PasswordSchema
}