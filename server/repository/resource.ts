import { Status, type Resource } from '_db';
import dayjs from 'dayjs';

export type CreateResourceInput = Pick<
	Resource,
	'type' | 'ext' | 'key' | 'name' | 'size'
>;
export const create = async (data: CreateResourceInput) => {
	return useDB().resource.create({
		data,
	});
};

export type UpdateResourceInput = Partial<Pick<Resource, 'status'>>;
export const updateStatus = async (
	id: Resource['id'],
	data: UpdateResourceInput,
) => {
	return useDB().resource.update({ where: { id: id }, data });
};

export const getResourceById = async (id: Resource['id'], status?: Status) => {
	return useDB().resource.findFirst({
		where: { id, status},
	});
};

export const listResourceByIDs = async (ids: Resource['id'][]) => {
	return useDB().resource.findMany({
		where: { id: { in: ids } },
	});
};

export const getExpiredResources = async () => {
	return useDB().resource.findMany({
		where: {
			status: Status.Disable,
			updated_at: {
				lt: dayjs().subtract(30, 'minutes').toDate(),
			},
		},
	});
};

export const deleteResourceByID = async (id: Resource['id']) => {
	return useDB().resource.delete({ where: { id: id } });
};

export const getResourceByKey = async (key: string)=>{
	return useDB().resource.findFirst({
		where: {
			key
		}
	})
}
