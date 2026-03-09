import { useCOS } from '~/server/lib/cos';
import type COS from 'cos-nodejs-sdk-v5';
import logger from '~/server/lib/winston';

export type GetPresignedUploadUrlInput = {
	key: string;
};
export const getPresignedUploadUrl = (params: GetPresignedUploadUrlInput) => {
	const cosConfig = useRuntimeConfig().storage.cos;
	return useCOS().getObjectUrl(
		{
			Method: 'PUT',
			Expires: 300,
			Bucket: cosConfig.bucket,
			Region: cosConfig.region,
			Key: params.key,
		},
		(err: COS.CosError, _: COS.GetObjectUrlResult) => {
			if (err) {
				logger.error('获取预签名上传链接失败', err);
			}
		},
	);
};

export type GetPresignedReadUrlInput = {
	key: string;
};
// 移除使用预签名读的方式，暂时只修改实现
// TODO 优化语义
export const getPresignedReadUrl = (params: GetPresignedReadUrlInput) => {
	const cosConfig = useRuntimeConfig().storage.cos;
	if (params.key.startsWith('/')) {
		params.key = params.key.substring(1);
	}
	return `${cosConfig.url}/${params.key}`;
};

export const getDirAllObjectURLs = async (prefix: string) => {
	const cosConfig = useRuntimeConfig().storage.cos;
	const result = await useCOS().getBucket({
		Prefix: prefix,
		Bucket: cosConfig.bucket,
		Region: cosConfig.region,
	});

	const urls = result.Contents.filter((object)=>{
		return object.Size !== '0'
	}).map((object) => {
		return getPresignedReadUrl({ key: object.Key });
	});

	return urls;
};

export const getDirAllObjectURLMap = async (prefix: string) => {
	const cosConfig = useRuntimeConfig().storage.cos;
	const result = await useCOS().getBucket({
		Prefix: prefix,
		Bucket: cosConfig.bucket,
		Region: cosConfig.region,
	});

	return result.Contents.filter((object) => {
		return object.Size !== '0'
	}).map((object) => {
		const url = useCOS().getObjectUrl(
			{
				Bucket: cosConfig.bucket,
				Region: cosConfig.region,
				Key: object.Key,
			},
			() => {
			},
		);
		// 取出文件名
		let name = object.Key.split('/').at(-1) || object.Key;
		// 移除后缀
		name = name.split('.')[0] || name;
		return {
			key: name,
			url,
		}
	});
};

export const deleteObjectByKey = async (key: string) => {
	const cosConfig = useRuntimeConfig().storage.cos;
	// 是否为文件夹
	if (key.startsWith('ExtractManga')) {
		const res = await useCOS().getBucket({
			Bucket: cosConfig.bucket,
			Region: cosConfig.region,
			Prefix: key,
		})
		const result = await useCOS().deleteMultipleObject({
			Bucket: cosConfig.bucket,
			Region: cosConfig.region,
			Objects: res.Contents.map(item=>({Key:item.Key}))
		})
		if (result.Error.length > 0) {
			throw new Error(`删除对象失败:${result.Error[0].Message}`);
		}
	} else {
		const result = await useCOS().deleteObject({
			Bucket: cosConfig.bucket,
			Region: cosConfig.region,
			Key: key,
		});
		if (result.statusCode !== 204) {
			throw new Error(`删除对象失败`);
		}
	}
};
