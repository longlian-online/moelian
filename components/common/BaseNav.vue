<template>
	<v-app-bar color="#A6A897">
		<v-container class="d-flex align-center py-0" style="max-width: 1200px">
			<v-app-bar-nav-icon
				v-if="isMobile"
				variant="text"
				@click="injectedToggleDrawer()"
			></v-app-bar-nav-icon>
			<!-- 桌面端导航条 -->
			<template v-if="!isMobile">
				<v-tabs
					v-model="activeTab"
					background-color="transparent"
					color="#333"
					slider-color="#333"
					class="flex-grow-0"
				>
					<v-tab value="home" to="/">
						<v-img :src="logoUrl" class="mx-2" width="100" height="64"></v-img>
					</v-tab>
					<v-tab value="index" to="/manga">漫画</v-tab>
					<v-tab value="update" to="/novel">小说</v-tab>
					<!-- <v-tab value="classify" to="/classify">分类</v-tab>
					<v-tab value="timeline" to="/timeline">时间表</v-tab>
					<v-tab value="admin" to="/admin">管理端</v-tab> -->
				</v-tabs>
			</template>

			<v-spacer></v-spacer>

			<template v-if="!isMobile">
				<v-text-field
					v-model="currentInputKey"
					:loading="currentLoading"
					prepend-inner-icon="mdi-magnify"
					density="compact"
					label="输入关键词搜索"
					variant="outlined"
					hide-details
					single-line
					clearable
					@keydown.enter="handleSearchClick()"
					@click:clear="handleClearSearch"
				>
					<template #append-inner
						><v-btn elevation="0" @click="handleSearchClick()"
							>搜索</v-btn
						></template
					>
				</v-text-field>
			</template>

			<!-- 移动端导航条 -->
			<template v-if="isMobile">
				<v-text-field
					v-model="currentInputKey"
					:loading="currentLoading"
					density="default"
					label="输入关键词"
					variant="outlined"
					hide-details
					single-line
					clearable
					@keydown.enter="handleSearchClick()"
					@click:clear="handleClearSearch"
				>
					<template #append-inner
						><v-btn
							elevation="0"
							icon="mdi-magnify"
							@click="handleSearchClick()"
						></v-btn
					></template>
				</v-text-field>
			</template>

			<template v-if="isMobile">
				<v-btn icon="mdi-dots-vertical" variant="text"></v-btn>
			</template>
		</v-container>
	</v-app-bar>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const store = useWebWorkStore();

// 1. 动态计算 V-Model 绑定的 Key (绑定到 inputKey)
const currentInputKey = computed({
	get: () => {
		if (route.name === 'manga') {
			return store.mangaInputKey;
		} else if (route.name === 'novel') {
			return store.novelInputKey;
		}
		return store.mangaInputKey;
	},
	set: (val: string) => {
		if (route.name === 'manga') {
			store.mangaInputKey = val;
		} else if (route.name === 'novel') {
			store.novelInputKey = val;
		} else {
			store.mangaInputKey = val;
		}
	},
});

// 2. 动态计算 Loading 状态 (绑定到 isLoading)
const currentLoading = computed(() => {
	if (route.name === 'manga') {
		return store.mangaIsLoading;
	} else if (route.name === 'novel') {
		return store.novelIsLoading;
	}
	return store.mangaIsLoading;
});

// --- 搜索事件 ---
const handleSearchClick = () => {
	// 获取当前路由的路径
	const currentPath = route.path;

	// 1 根据当前路由的路径前缀调用正确的搜索动作

	// 检查路径是否以 '/manga' 开头
	if (currentPath.startsWith('/manga')) {
		store.triggerMangaSearch();

		// 只有当当前路径不是 '/manga' 根路径时才执行跳转
		if (currentPath !== '/manga') {
			router.push('/manga');
		}

		// 检查路径是否以 '/novel' 开头
	} else if (currentPath.startsWith('/novel')) {
		store.triggerNovelSearch();

		// 只有当当前路径不是 '/novel' 根路径时才执行跳转
		if (currentPath !== '/novel') {
			router.push('/novel');
		}
	} else {
		// 3. 如果在其他页面点击搜索，执行默认搜索并跳转到默认页
		store.triggerMangaSearch();
		router.push('/manga');
	}
};

//清空
const handleClearSearch = () => {
	if (route.name === 'manga') {
		// 强制确保清空操作立即触发搜索
		store.triggerMangaSearch();
	} else if (route.name === 'novel') {
		store.triggerNovelSearch();
	}
};

const { isMobile } = useDevice();
const logoUrl = useRuntimeConfig().public.logoUrl;
const injectedToggleDrawer = inject('toggle-drawer-fn', () => {
	console.error('Error: toggle-drawer-fn not provided!');
}) as () => void;

const activeTab = ref('index');

// 确保 ref 的值与路由同步
watch(
	() => route.path,
	(newPath) => {
		if (newPath === '/') {
			activeTab.value = 'home';
		} else if (newPath.startsWith('/manga')) {
			activeTab.value = 'index';
		} else if (newPath.startsWith('/novel')) {
			activeTab.value = 'update';
		}
	},
	{
		immediate: true,
	},
);
</script>

<style scoped>
.searchInputText {
	margin-left: 16px;
	margin-right: 8px;
	align-self: center;
}

.v-app-bar .v-img {
	align-self: center;
}
</style>
