<script setup lang="ts">
import type { NovelReadingBlock } from '~/shared/types/novel-content';
defineProps<{
	loadedContent: NovelReadingBlock[];
	loading?: boolean;
	loadFailed?: boolean;
	mobile?: boolean;
}>();
defineEmits<{ retry: []; share: [quote: string] }>();
</script>
<template>
	<NovelSelectionShare @share="$emit('share', $event)">
		<div
			class="content-box"
			:class="{
				'content-box--loading': loading,
				'novel-content--mobile': mobile,
			}"
			:aria-busy="loading"
		>
			<NetworkErrorState
				v-if="loadFailed && !loading"
				@retry="$emit('retry')"
				@home="navigateTo('/')"
			/>
			<NovelContentSkeleton v-else-if="loading" />
			<div
				v-for="({ content, isCenter, type, label }, index) in loadedContent"
				:key="index"
				:data-reading-block="index"
				class="novel-reading-block"
			>
				<template v-if="type === 'img'">
					<div
						:class="[
							'd-flex flex-column align-center w-100',
							mobile ? 'my-6' : 'my-8',
						]"
					>
						<v-card
							elevation="4"
							:class="[
								'lily-frame',
								mobile ? 'pa-2 rounded-lg' : 'pa-3 rounded-xl',
							]"
							:max-width="mobile ? '92%' : '85%'"
						>
							<v-img :src="content" width="100%" class="rounded-lg">
								<template #placeholder>
									<v-skeleton-loader
										type="image"
										width="100%"
										:height="mobile ? 250 : 400"
										class="rounded-lg"
									></v-skeleton-loader>
								</template>
								<template #error>
									<v-img
										src="/error-default.jpg"
										width="100%"
										class="rounded-lg"
									></v-img>
								</template>
							</v-img>
						</v-card>
						<div
							:class="[
								'lily-label-container d-flex align-center',
								mobile ? 'mt-3' : 'mt-4',
							]"
						>
							<svg
								class="lily-icon"
								viewBox="0 0 100 100"
								:width="mobile ? 16 : 20"
								:height="mobile ? 16 : 20"
							>
								<path
									d="M50 10 C60 40 90 50 50 90 C10 50 40 40 50 10"
									fill="#ff6b9d"
								/>
							</svg>
							<span
								v-if="label"
								:class="['lily-text', mobile ? 'mx-2' : 'mx-3']"
								>{{ label }}</span
							>
							<svg
								class="lily-icon"
								viewBox="0 0 100 100"
								:width="mobile ? 16 : 20"
								:height="mobile ? 16 : 20"
								style="transform: scaleX(-1)"
							>
								<path
									d="M50 10 C60 40 90 50 50 90 C10 50 40 40 50 10"
									fill="#ff6b9d"
								/>
							</svg>
						</div>
					</div>
				</template>
				<template v-else>
					<p
						class="my-content"
						:style="{ textAlign: isCenter ? 'center' : 'left' }"
					>
						<span>{{ content }}</span>
					</p>
					<br />
				</template>
			</div>
		</div>
	</NovelSelectionShare>
</template>
<style scoped>
.content-box p {
	text-indent: 2em;
}

.content-box :deep(.v-img__img) {
	position: relative !important;
}

.lily-frame {
	background-color: #fff0f5; /* 樱花粉衬底 */
	border: 4px solid #ff6b9d; /* 更鲜艳的粉色边框 */
	border-radius: 12px;
	box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
	position: relative;
	overflow: hidden;
}

.lily-text {
	color: #ff6b9d !important; /* 统一为鲜艳的粉色 */
	font-weight: 600;
	letter-spacing: 1px;
	font-size: 0.875rem;
}

.lily-icon {
	opacity: 0.6;
}

.my-content span {
	background-image: linear-gradient(orange, orange);
	background-repeat: no-repeat;
	background-size: 0% 2px;
	background-position: right bottom;
	transition: background-size 1s ease-out;
}

.my-content span:hover {
	background-size: 100% 2px;
	background-position: left bottom;
	transition: background-size 1s ease-out;
}

.content-box {
	position: relative;
	min-height: 70vh;
}

.novel-reading-block {
	opacity: 1;
	animation: novel-content-reveal 0.35s ease both;
}

@keyframes novel-content-reveal {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.content-box--loading .novel-reading-block {
	opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
	.novel-reading-block {
		animation: none;
	}
}

.novel-content--mobile .lily-frame {
	border-width: 3px;
	box-shadow: 0 3px 12px rgba(255, 107, 157, 0.25);
}

.novel-content--mobile .lily-text {
	font-size: 0.75rem;
	letter-spacing: normal;
}
.novel-content--mobile .lily-icon {
	opacity: 1;
}
</style>
