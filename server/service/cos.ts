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
export const getPresignedReadUrl = (params: GetPresignedReadUrlInput) => {
	const cosConfig = useRuntimeConfig().storage.cos;
	return useCOS().getObjectUrl(
		{
			Method: 'GET',
			Expires: 300,
			Bucket: cosConfig.bucket,
			Region: cosConfig.region,
			Key: params.key,
		},
		(err: COS.CosError, _: COS.GetObjectUrlResult) => {
			if (err) {
				logger.error('获取预签名读取链接失败', err);
			}
		},
	);
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
		return useCOS().getObjectUrl(
			{
				Bucket: cosConfig.bucket,
				Region: cosConfig.region,
				Key: object.Key,
			},
			() => {},
		);
	});

	return urls;
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
