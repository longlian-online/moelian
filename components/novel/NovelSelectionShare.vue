<template>
	<div
		ref="container"
		class="novel-selection-share"
		@contextmenu="openContextMenu"
	>
		<slot></slot>
	</div>
	<v-fade-transition>
		<div
			v-if="isMenuVisible"
			ref="menu"
			class="novel-selection-share__menu"
			:style="menuStyle"
		>
			<v-btn
				color="primary"
				prepend-icon="mdi-share-variant-outline"
				size="small"
				@click="shareSelection"
			>
				分享
			</v-btn>
		</div>
	</v-fade-transition>
</template>

<script setup lang="ts">
import { normalizeNovelQuote } from '~/utils/novelShare';

const emit = defineEmits<{
	share: [quote: string];
}>();

const container = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const selectedQuote = ref('');
const isMenuVisible = ref(false);
const menuPosition = ref({ left: 0, top: 0 });

const menuStyle = computed(() => ({
	left: `${menuPosition.value.left}px`,
	top: `${menuPosition.value.top}px`,
}));

function getSelectionQuote() {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed)
		return '';
	const root = container.value;
	if (
		!root ||
		!selection.anchorNode ||
		!selection.focusNode ||
		!root.contains(selection.anchorNode) ||
		!root.contains(selection.focusNode)
	) {
		return '';
	}
	return normalizeNovelQuote(selection.toString());
}

function showMenu(position?: { left: number; top: number }) {
	const quote = getSelectionQuote();
	if (!quote) {
		hideMenu();
		return;
	}

	selectedQuote.value = quote;
	if (position) {
		menuPosition.value = position;
	} else {
		const selection = window.getSelection();
		const rect = selection?.getRangeAt(0).getBoundingClientRect();
		if (!rect) return;
		menuPosition.value = {
			left: Math.min(window.innerWidth - 92, Math.max(12, rect.right - 80)),
			top: Math.min(window.innerHeight - 48, Math.max(12, rect.bottom + 8)),
		};
	}
	isMenuVisible.value = true;
}

function openContextMenu(event: MouseEvent) {
	const quote = getSelectionQuote();
	if (!quote) return;
	event.preventDefault();
	showMenu({
		left: Math.min(window.innerWidth - 92, Math.max(12, event.clientX)),
		top: Math.min(window.innerHeight - 48, Math.max(12, event.clientY)),
	});
}

function handleSelectionChange() {
	const quote = getSelectionQuote();
	if (!quote) {
		hideMenu();
		return;
	}
	showMenu();
}

function handlePointerDown(event: PointerEvent) {
	const target = event.target as Node | null;
	if (
		target &&
		(container.value?.contains(target) || menu.value?.contains(target))
	) {
		return;
	}
	hideMenu();
}

function handleScroll() {
	hideMenu();
}

function hideMenu() {
	isMenuVisible.value = false;
}

function shareSelection() {
	if (!selectedQuote.value) return;
	emit('share', selectedQuote.value);
	hideMenu();
}

onMounted(() => {
	document.addEventListener('selectionchange', handleSelectionChange);
	document.addEventListener('pointerdown', handlePointerDown);
	window.addEventListener('scroll', handleScroll, true);
});

onBeforeUnmount(() => {
	document.removeEventListener('selectionchange', handleSelectionChange);
	document.removeEventListener('pointerdown', handlePointerDown);
	window.removeEventListener('scroll', handleScroll, true);
});
</script>

<style scoped>
.novel-selection-share__menu {
	position: fixed;
	z-index: 3000;
	box-shadow: 0 8px 22px rgba(104, 69, 121, 0.24);
}
</style>
