import type { ResourceType, Resource } from '../lib/prisma';
import {
	deleteObjectByKey,
	getPresignedReadUrl,
	getPresignedUploadUrl,
} from './cos';
import * as dao from '../repository/resource';
import { SYSTEM_ERROR } from '../types/business_exception';
import { uuidv7 } from 'uuidv7';
import { deleteResourceByID } from '../repository/resource';
import logger from '../lib/winston';

export type CreateResourceInput = {
	ext: string;
	type: ResourceType;
	size: number;
};
export const create = async (data: CreateResourceInput) => {
	const name = uuidv7();
	const key = keyGen(name, data.type, data.ext);
	const url = getPresignedUploadUrl({
		key,
	});
	if (!url) {
		throw new SYSTEM_ERROR();
	}

	const resource = await dao.create({
		ext: data.ext,
		key,
		name,
		size: data.size,
		type: data.type,
	});

	return {
		url,
		id: resource.id,
	};
};

/**
 * 获取资源链接，如果id为空，返回默认资源
 * @param id 资源id
 * @param baseUrl 云存储基础路径
 * @param type 资源类型
 */
export const getResourceURLByID = async (
	id: Resource['id'] | null,
	baseUrl: string,
	type: ResourceType,
) => {
	if (!id) {
		return getDefaultResourceURLByType(baseUrl, type);
	}
	const resource = await dao.getResourceById(id);
	return getResourceURL(resource, baseUrl, type);
};

export const getDefaultResourceURLByType = (
	baseUrl: string,
	type: ResourceType,
) => {
	return `${baseUrl}/Default/${type}`;
};

export const getDefaultResourceKeyByType = (type: ResourceType) => {
	return `Default/${type}`;
};

export const getResourceURL = (
	resource: Resource | null,
	baseUrl: string,
	type: ResourceType,
) => {
	if (!resource) {
		return getDefaultResourceURLByType(baseUrl, type);
	}
	return getPresignedReadUrl({
		key: resource.key,
	});
};

/**
 * 基于入参拼接资源Key
 */
const keyGen = (name: string, type: ResourceType, ext: string) => {
	return `${type}/${name}.${ext}`;
};

/**
 * 删除过期资源
 */
export const deleteExpiredResource = async () => {
	const resources = await dao.getExpiredResources();
	if (!resources) {
		return;
	}
	for (const item of resources) {
		try {
			await deleteObjectByKey(item.key);

			await deleteResourceByID(item.id);
		} catch (e) {
			logger.warn(`删除资源${item.key}失败，原因：${e}`);
			continue
		}
		logger.info(`删除资源${item.key}成功`);
	}
};
