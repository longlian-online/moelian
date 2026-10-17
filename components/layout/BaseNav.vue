<template>
	<v-app-bar
		color="#A6A897"
		:elevation="['manga', 'novel'].includes(String(route.name)) ? 0 : undefined"
	>
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
					<v-tab value="classify" to="/classify">分类</v-tab>
					<!-- <v-tab value="classify" to="/classify">分类</v-tab>
					<v-tab value="timeline" to="/timeline">时间表</v-tab>
					<v-tab value="admin" to="/admin">管理端</v-tab> -->
				</v-tabs>
			</template>

			<v-spacer></v-spacer>

			<v-select
				v-model="selectedFilterTags"
				:items="filterTagItems"
				multiple
				chips
				clearable
				label="标签筛选"
				placeholder="选择标签"
				persistent-placeholder
				density="compact"
				variant="outlined"
				hide-details
				single-line
				class="nav-tag-filter"
			>
				<template #selection="{ item, index }">
					<span v-if="index === 0" class="nav-selected-tag">{{
						item.title
					}}</span>
					<span v-if="index === 1" class="nav-tag-count"
						>+{{ selectedFilterTags.length - 1 }}</span
					>
				</template>
			</v-select>

			<template v-if="!isMobile">
				<v-text-field
					class="nav-search"
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
					class="nav-search"
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

			<!-- <template v-if="isMobile">
				<v-btn icon="mdi-dots-vertical" variant="text"></v-btn>
			</template> -->
		</v-container>
	</v-app-bar>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const store = useWebWorkStore();

const { data: filterTagData } =
	useApiFetch<import('~/shared/dto/web').TagWebItem[]>('/api/web/tag/all');
const filterTagItems = computed(
	() => filterTagData.value?.data?.map((tag) => tag.content) ?? [],
);
const isCategoryRoute = computed(() => route.path.startsWith('/classify/'));
const selectedFilterTags = computed<string[]>({
	get: () => {
		if (route.query.tags !== undefined) {
			const raw = route.query.tags;
			return (Array.isArray(raw) ? raw : [raw]).filter((tag): tag is string =>
				Boolean(tag),
			);
		}
		if (isCategoryRoute.value) {
			const tag = filterTagData.value?.data?.find(
				(tag) => tag.id === Number(route.params.tagId),
			);
			return tag ? [tag.content] : [];
		}
		return [];
	},
	set: (value) => {
		const tags = value ?? [];
		const target = route.path.startsWith('/novel')
			? '/novel'
			: route.path.startsWith('/manga')
				? '/manga'
				: isCategoryRoute.value
					? route.path
					: '/classify/all';
		router.push({
			path: target,
			query: { ...route.query, tags: tags.length ? tags : '' },
		});
	},
});
const currentInputKey = ref(String(route.query.key ?? ''));
watch(
	() => route.query.key,
	(key) => {
		currentInputKey.value = String(key ?? '');
	},
);
const currentLoading = computed(() =>
	route.path.startsWith('/novel') ? store.novelIsLoading : store.mangaIsLoading,
);
const handleSearchClick = () => {
	const path = route.path.startsWith('/novel')
		? '/novel'
		: isCategoryRoute.value
			? route.path
			: '/manga';
	router.push({
		path,
		query: { ...route.query, key: currentInputKey.value || undefined },
	});
};
const handleClearSearch = () => {
	currentInputKey.value = '';
	handleSearchClick();
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

<style scoped>
.nav-tag-filter {
	flex: 0 1 220px;
	min-width: 140px;
	margin-right: 12px;
}
.nav-search {
	flex: 0 1 340px;
	min-width: 160px;
}
.nav-tag-filter :deep(.v-field__input) {
	flex-wrap: nowrap;
	overflow: hidden;
}
.nav-selected-tag {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 115px;
}
.nav-tag-count {
	flex-shrink: 0;
	margin-left: 6px;
	font-size: 12px;
}
@media (max-width: 600px) {
	.nav-tag-filter {
		flex: 0 0 120px;
		min-width: 0;
		margin-right: 8px;
	}
	.nav-search {
		flex: 1;
		min-width: 0;
	}
	.nav-selected-tag {
		max-width: 50px;
		font-size: 12px;
	}
	.nav-search :deep(.v-field__input) {
		min-width: 0;
		padding-inline: 8px;
	}
	.nav-search :deep(.v-btn) {
		width: 28px;
		height: 32px;
	}
}
</style>
