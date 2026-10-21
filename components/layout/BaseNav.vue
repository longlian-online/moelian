<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const store = useWebWorkStore();
const { isMobile } = useDevice();
const compact = ref(isMobile);
const searchOpen = ref(false);
const headerVisible = useScrollReveal(true, {
	showAtTop: () => barHeight.value,
	alwaysVisible: searchOpen,
	clampToDocument: true,
	animationFrame: true,
});
const searchField = useTemplateRef<{ focus: () => void }>('searchField');
const searchId = `nav-search-${useId()}`;
const toggleDrawer = inject<() => void>('toggle-drawer-fn', () => {});
const currentInputKey = ref(String(route.query.key ?? ''));
const links = [
	{ to: '/manga', label: '漫画' },
	{ to: '/novel', label: '小说' },
	{ to: '/classify', label: '分类' },
];
const isActive = (path: string) =>
	route.path === path || route.path.startsWith(`${path}/`);
const barHeight = computed(() =>
	compact.value ? 56 + (searchOpen.value ? 56 : 0) : 64,
);
const currentLoading = computed(() =>
	route.path.startsWith('/novel') ? store.novelIsLoading : store.mangaIsLoading,
);
watch(
	() => route.query.key,
	(key) => {
		currentInputKey.value = String(key ?? '');
	},
);

// SSR 先按设备判断；挂载后响应窗口宽度，首轮水合结构保持一致。
onMounted(() => {
	const media = window.matchMedia('(max-width: 760px)');
	const update = () => {
		compact.value = media.matches;
		if (!compact.value) searchOpen.value = false;
	};
	update();
	media.addEventListener('change', update);
	onBeforeUnmount(() => media.removeEventListener('change', update));
});

const openSearch = async () => {
	headerVisible.value = true;
	searchOpen.value = true;
	await nextTick();
	searchField.value?.focus();
};
const handleSearchClick = () => {
	const path = route.path.startsWith('/novel')
		? '/novel'
		: route.path.startsWith('/classify/')
			? route.path
			: '/manga';
	return router.push({
		path,
		query: { ...route.query, key: currentInputKey.value || undefined },
	});
};
const handleClearSearch = () => {
	currentInputKey.value = '';
	void handleSearchClick();
};
</script>

<template>
	<v-app-bar
		class="journal-bar"
		color="#fffaf1"
		:height="barHeight"
		:class="{ 'journal-bar--hidden': !headerVisible && !searchOpen }"
		:inert="!headerVisible && !searchOpen"
		:elevation="0"
	>
		<div class="journal-header" :class="{ 'journal-header--compact': compact }">
			<div class="journal-top">
				<v-btn
					v-if="compact"
					class="journal-icon"
					icon="mdi-menu"
					variant="text"
					aria-label="打开菜单"
					@click="toggleDrawer"
				/>
				<NavBrand :compact="compact" />
				<nav v-if="!compact" class="journal-tabs" aria-label="主导航">
					<NuxtLink
						v-for="link in links"
						:key="link.to"
						:to="link.to"
						class="journal-tab"
						:class="{ 'journal-tab--active': isActive(link.to) }"
						:aria-current="isActive(link.to) ? 'page' : undefined"
						>{{ link.label }}</NuxtLink
					>
				</nav>
				<v-btn
					v-if="compact"
					class="journal-icon journal-search-toggle"
					icon="mdi-magnify"
					variant="text"
					aria-label="展开搜索"
					:aria-expanded="searchOpen"
					:aria-controls="searchId"
					@click="searchOpen ? (searchOpen = false) : openSearch()"
				/>
				<form
					v-if="!compact"
					class="journal-search"
					role="search"
					@submit.prevent="handleSearchClick"
				>
					<v-text-field
						v-model="currentInputKey"
						class="journal-search-field"
						:loading="currentLoading"
						prepend-inner-icon="mdi-magnify"
						label="搜索漫画、小说"
						variant="outlined"
						density="compact"
						hide-details
						single-line
						clearable
						@keydown.enter.prevent="handleSearchClick"
						@click:clear="handleClearSearch"
					>
						<template #append-inner
							><v-btn
								type="button"
								variant="text"
								size="small"
								@click="handleSearchClick"
								>搜索</v-btn
							></template
						>
					</v-text-field>
				</form>
			</div>
			<form
				v-if="compact && searchOpen"
				:id="searchId"
				class="journal-search journal-mobile-search"
				role="search"
				@submit.prevent="handleSearchClick"
				@keydown.esc="searchOpen = false"
			>
				<v-text-field
					ref="searchField"
					v-model="currentInputKey"
					class="journal-search-field"
					:loading="currentLoading"
					label="搜索漫画、小说"
					variant="outlined"
					density="compact"
					hide-details
					single-line
					clearable
					@keydown.enter.prevent="handleSearchClick"
					@click:clear="handleClearSearch"
				>
					<template #append-inner
						><v-btn
							type="button"
							icon="mdi-magnify"
							variant="text"
							size="small"
							aria-label="搜索"
							@click="handleSearchClick"
					/></template>
				</v-text-field>
				<v-btn
					icon="mdi-close"
					variant="text"
					size="small"
					aria-label="关闭搜索"
					@click="searchOpen = false"
				/>
			</form>
		</div>
	</v-app-bar>
</template>

<style scoped>
.journal-bar {
	border-bottom: 1px solid #e7d8c7;
	box-shadow: 0 3px 12px rgb(106 77 51 / 5%) !important;
	color: #6f5949 !important;
}
/* 保留 Vuetify 的布局占位，只移动页眉，避免滚动方向被布局回弹干扰。 */
.journal-bar--hidden {
	transform: translateY(-100%) !important;
	pointer-events: none;
}
.journal-header {
	width: 100%;
	max-width: 1200px;
	margin-inline: auto;
	padding-inline: 24px;
	min-width: 0;
}
.journal-top {
	display: flex;
	align-items: center;
	gap: 28px;
	height: 64px;
	min-width: 0;
}
.journal-tabs {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}
.journal-tab {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 64px;
	height: 36px;
	padding: 0 16px;
	border-radius: 7px 7px 3px 3px;
	color: #88705e;
	font-size: 14px;
	text-decoration: none;
	transition:
		background-color 150ms,
		color 150ms;
}
.journal-tab:hover {
	background: #f5ece1;
	color: #654a3a;
}
.journal-tab--active {
	background: #f5e7e2;
	color: #996866;
}
.journal-tab--active::after {
	content: '';
	position: absolute;
	bottom: 3px;
	left: calc(50% - 10px);
	width: 20px;
	height: 2px;
	border-radius: 2px;
	background: #c68d85;
}
.journal-tab:focus-visible {
	outline: 2px solid #b78079;
	outline-offset: 3px;
}
.journal-search {
	flex: 0 1 360px;
	margin-left: auto;
	min-width: 0;
}
.journal-search-field :deep(.v-field) {
	background: #f7f0e5;
	border-radius: 9px;
	color: #8b7561;
	font-size: 13px;
}
.journal-search-field :deep(.v-field__outline) {
	--v-field-border-opacity: 0.18;
}
.journal-search-field :deep(.v-field__input) {
	min-width: 0;
}
.journal-search-field :deep(.v-btn) {
	color: #96745f;
}
.journal-icon {
	flex: 0 0 40px;
	width: 40px;
	height: 40px;
	color: #92755f;
}
.journal-header--compact {
	padding-inline: 12px;
}
.journal-header--compact .journal-top {
	height: 56px;
	gap: 8px;
}
.journal-header--compact .journal-top :deep(.nav-brand) {
	margin-inline: auto;
}
.journal-mobile-search {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	height: 56px;
	width: 100%;
}
.journal-mobile-search .journal-search-field {
	flex: 1;
	min-width: 0;
}
@media (min-width: 761px) and (max-width: 1000px) {
	.journal-header {
		padding-inline: 16px;
	}
	.journal-top {
		gap: 16px;
	}
	.journal-tabs {
		gap: 2px;
	}
	.journal-tab {
		min-width: 54px;
		padding-inline: 12px;
	}
}
@media (prefers-reduced-motion: reduce) {
	.journal-tab {
		transition: none;
	}
}
</style>
