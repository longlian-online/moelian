
export default defineWrappedResponseHandler(async event => {
    // 清除用户会话
    await clearUserSession(event);
    return;
})