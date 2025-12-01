// server/utils/cos.ts
import COS from 'cos-nodejs-sdk-v5';
import { useRuntimeConfig } from "#imports";
import logger from "~/server/lib/winston";

export const useCOS = () => {
  // 使用 nitro 的共享存储，避免热重载问题
  const nitroApp = useNitroApp();

  if (!nitroApp.cosClient) {
    const config = useRuntimeConfig();

    nitroApp.cosClient = new COS({
      SecretId: config.storage.cos.secretId,
      SecretKey: config.storage.cos.secretKey
    });

    logger.info("COS client initialized");
  }

  return nitroApp.cosClient;
};
