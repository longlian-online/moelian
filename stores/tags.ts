import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useApiFetch } from '~/utils/apiFetch';

export type AdminTagItem = {
	id: number;
	content: string;
	cover: string;
	createdAt?: string;
};

export const useTagStore = defineStore('tag', () => {
	const allTags = ref<AdminTagItem[]>([]);
	const loaded = ref(false);
	const fetching = ref(false);

	const fetchAllTags = async (force = false) => {
		if (fetching.value && !force) return;
		fetching.value = true;
		try {
			const { data, error } = await useApiFetch<AdminTagItem[]>(
				'/api/admin/tag/all',
			);

			if (!error.value && data.value && Array.isArray(data.value.data)) {
				allTags.value = data.value.data;
				loaded.value = true;
			}
		} catch (e) {
			console.error(e);
		} finally {
			fetching.value = false;
		}
	};

	/** 确保已加载，若未加载则请求一次 */
	const ensureLoaded = async () => {
		if (!loaded.value && !fetching.value) {
			await fetchAllTags();
		}
	};

	/** 刷新标签列表（CRUD 后调用） */
	const refresh = () => {
		loaded.value = false;
		return fetchAllTags(true);
	};

	const allTagNames = computed(() =>
		allTags.value.map((t) => t.content),
	);

	const tagNameToIdMap = computed(() => {
		const map = new Map<string, number>();
		allTags.value.forEach((t) => map.set(t.content, t.id));
		return map;
	});

	return {
		allTags,
		loaded,
		fetching,
		fetchAllTags,
		ensureLoaded,
		refresh,
		allTagNames,
		tagNameToIdMap,
	};
});
