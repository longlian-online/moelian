import type { WorkListReq, WorkListRes } from '~/shared/dto/web/work';
import { ContentType } from '_db';
// ⚠️ 后端写死的每页限制：24
const HARDCODED_LIMIT = 24;

// --- 状态结构定义 ---

/**
 * 列表页面的通用状态结构
 */
interface WorkListState {
	// 列表请求参数
	page: number;
	type: ContentType;
	// API返回的原始数据
	data: WorkListRes | null;
	// 加载状态
	isLoading: boolean;
	searchKey: string; //  实际用于 API 请求的关键词
	inputKey: string; //  绑定到输入框 V-Model 的关键词
}

// --- Pinia Store 定义 ---

export const useWebWorkStore = defineStore('web-work', () => {
	// 1. 定义状态 (State)

	const mangaState = reactive<WorkListState>({
		page: 1,
		type: ContentType.Manga,
		data: null,
		isLoading: false,
		searchKey: '',
		inputKey: '',
	});

	const novelState = reactive<WorkListState>({
		page: 1,
		type: ContentType.Novel,
		data: null,
		isLoading: false,
		searchKey: '',
		inputKey: '',
	});

	// 2. 核心请求方法 (Action)

	const fetchWorkList = async (state: WorkListState) => {
		state.isLoading = true;
		const query: WorkListReq = {
			page: state.page,
			type: state.type,
			key: state.searchKey, // 使用 searchKey
		};

		try {
			const { data } = await useApiFetch<WorkListRes>('/api/web/work', {
				method: 'GET',
				query: query,
			});
			//解包数据
			if (data.value && data.value.data) {
				state.data = data.value.data;
			} else {
				state.data = { total: 0, list: [] }; // 处理无 data 的情况
			}
		} catch (error) {
			console.error(`获取 ${state.type} 列表失败:`, error);
			state.data = { total: 0, list: [] };
		} finally {
			state.isLoading = false;
		}
	};

	// 3. 公共函数 (Actions) - 触发数据加载

	const getAllManga = () => fetchWorkList(mangaState);
	const getAllNovel = () => fetchWorkList(novelState);

	const triggerMangaSearch = () => {
		// 1. 将输入框的值赋值给实际的搜索 Key
		mangaState.searchKey = mangaState.inputKey;

		// 2. 如果当前不在第一页，强制跳转到第一页 (这会触发 watch 导致请求)
		if (mangaState.page !== 1) {
			mangaState.page = 1;
			return;
		}

		// 3. 如果已经在第一页，直接发起请求
		getAllManga();
	};

	const triggerNovelSearch = () => {
		novelState.searchKey = novelState.inputKey;

		if (novelState.page !== 1) {
			novelState.page = 1;
			return;
		}

		getAllNovel();
	};
	// 4. 计算属性 (Getters) - 分页逻辑和列表数据

	// Manga 列表数据
	const mangaList = computed(() => mangaState.data?.list || []);
	// Manga 总条目数
	const mangaTotalItems = computed(() => mangaState.data?.total || 0);
	// Manga 总页数 (使用 HARDCODED_LIMIT=24 计算)
	const mangaPageCount = computed(
		() => Math.ceil(mangaTotalItems.value / HARDCODED_LIMIT) || 1,
	);

	// Novel 列表数据
	const novelList = computed(() => novelState.data?.list || []);
	// Novel 总条目数
	const novelTotalItems = computed(() => novelState.data?.total || 0);
	// Novel 总页数 (使用 HARDCODED_LIMIT=24 计算)
	const novelPageCount = computed(
		() => Math.ceil(novelTotalItems.value / HARDCODED_LIMIT) || 1,
	);

	const mangaIsLoading = computed(() => mangaState.isLoading);
	const novelIsLoading = computed(() => novelState.isLoading);

	//获取除自己以外的四个推荐作品
	const getMangaRecommendations = (workId: number): WorkListRes['list'] => {
		return mangaList.value.filter((work) => work.id !== workId).slice(0, 4);
	};

	const getNovelRecommendations = (workId: number): WorkListRes['list'] => {
		return novelList.value.filter((work) => work.id !== workId).slice(0, 4);
	};

	// 返回给组件使用的属性和方法
	return {
		// 强制使用 toRef 来返回 inputKey，确保它是一个 Ref<string>
		mangaInputKey: toRef(mangaState, 'inputKey'),
		novelInputKey: toRef(novelState, 'inputKey'),

		novelIsLoading,
		mangaIsLoading,

		// 列表数据和分页
		mangaState,
		novelState,
		mangaList,
		mangaTotalItems,
		mangaPageCount,

		novelList,
		novelTotalItems,
		novelPageCount,

		// 方法
		fetchWorkList,

		triggerMangaSearch,
		triggerNovelSearch,
		getAllManga,
		getAllNovel,
		getMangaRecommendations,
		getNovelRecommendations,
	};
});
