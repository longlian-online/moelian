<template>
	<div class="tags-wrapper">
		<!-- 标签容器 -->
		<div class="book-tags-container">
			<div
				v-for="(tag, index) in tags"
				:key="index"
				class="book-tag"
				:style="getTagStyle(tag)"
			>
				<!-- 呼吸灯圆点 -->
				<div class="breathing-light"></div>
				<!-- 标签文字 -->
				<span class="tag-text">{{ tag }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
	tags?: string[];
}

withDefaults(defineProps<Props>(), {
	tags: () => ['百合', '校园', '治愈'],
});

// 预定义常见tag的柔和配色方案
const tagColorMap: Record<string, { from: string; to: string }> = {
	百合: { from: '#E8A0BF', to: '#BA68C8' }, // 柔和粉紫
	校园: { from: '#81C784', to: '#66BB6A' }, // 柔和绿
	治愈: { from: '#90CAF9', to: '#64B5F6' }, // 柔和蓝
	恋爱: { from: '#F48FB1', to: '#EC407A' }, // 柔和粉红
	搞笑: { from: '#FFB74D', to: '#FFA726' }, // 柔和橙
	热血: { from: '#EF5350', to: '#E53935' }, // 柔和红
	悬疑: { from: '#9575CD', to: '#7E57C2' }, // 柔和紫
	奇幻: { from: '#4DD0E1', to: '#26C6DA' }, // 柔和青
	日常: { from: '#AED581', to: '#9CCC65' }, // 柔和黄绿
	运动: { from: '#FF8A65', to: '#FF7043' }, // 柔和橙红
	励志: { from: '#FFD54F', to: '#FFCA28' }, // 柔和黄
	冒险: { from: '#4FC3F7', to: '#29B6F6' }, // 柔和天蓝
	科幻: { from: '#7986CB', to: '#5C6BC0' }, // 柔和靛蓝
	魔法: { from: '#BA68C8', to: '#AB47BC' }, // 柔和紫红
	推理: { from: '#78909C', to: '#607D8B' }, // 柔和灰蓝
};

// 根据字符串生成柔和的颜色（HSL色彩空间，降低饱和度和亮度）
const getColorFromString = (str: string) => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	// 生成色相 (0-360)
	const hue = Math.abs(hash % 360);
	// 降低饱和度 (45-60%) 让颜色更柔和
	const saturation = 45 + (Math.abs(hash) % 16);
	// 降低亮度 (50-60%) 避免过亮
	const lightness = 50 + (Math.abs(hash >> 8) % 11);

	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// 获取标签的渐变样式
const getTagStyle = (tag: string) => {
	if (tagColorMap[tag]) {
		const { from, to } = tagColorMap[tag];
		return {
			background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
		};
	}

	// 如果没有预定义，使用算法生成柔和的颜色
	const color1 = getColorFromString(tag);
	const color2 = getColorFromString(tag + tag); // 生成第二个颜色

	return {
		background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
	};
};
</script>

<style scoped>
/* 1. 容器：支持多标签换行，防止溢出 */
.tags-wrapper {
	position: absolute;
	top: 8px;
	left: 8px;
	z-index: 25;
	max-width: calc(100% - 16px);
}

.book-tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	max-width: 100%;
}

/* 2. 标签主体：非对称圆角 + 柔和渐变 */
.book-tag {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 3px 10px 3px 8px;
	/* background 由 JS 动态设置 */
	border-radius: 4px 10px 4px 10px;
	border: 1px solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	transition: all 0.3s ease;
	cursor: default;
}

.book-tag:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
	filter: brightness(1.1);
}

/* 3. 呼吸灯：简单的透明度变化 */
.breathing-light {
	width: 7px;
	height: 7px;
	background-color: #fff;
	border-radius: 50%;
	position: relative;
	flex-shrink: 0;
	animation: breathing 2s ease-in-out infinite;
}

@keyframes breathing {
	0%,
	100% {
		opacity: 1;
		box-shadow: 0 0 3px #fff;
	}
	50% {
		opacity: 0.4;
		box-shadow: 0 0 1px #fff;
	}
}

/* 4. 文字样式 */
.tag-text {
	color: #fff;
	font-weight: bold;
	font-size: 11px;
	text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
	white-space: nowrap;
	letter-spacing: 0.5px;
}
</style>
