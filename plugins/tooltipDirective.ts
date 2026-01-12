import { h, render } from 'vue';
import { VTooltip } from 'vuetify/components';

/**
 * v-tooltip 自定义指令
 * 使用方式：
 * 1. v-tooltip="'提示文字'"
 * 2. v-tooltip:top="'上方提示'" (支持 top, bottom, left, right 参数)
 */
export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.directive('tooltip', {
		mounted(el, binding) {
			const text = binding.value;
			if (!text) return;

			// 1. 创建一个挂载容器
			const container = document.createElement('div');

			// 2. 使用 Vue 的 h 函数创建 Vuetify 的 VTooltip 组件
			// 我们利用 activator 属性将其绑定到当前元素 el 上
			const vnode = h(
				VTooltip,
				{
					activator: el,
					location: binding.arg || 'bottom',
					eager: true,
					// 使用 Vuetify 官方 Prop，使用字符串格式
					maxWidth: '400px',
					// 使用 contentClass 将样式应用到内容容器，必须与 app.vue 一致
					contentClass: 'custom-tooltip-box',
				},
				{
					default: () => text,
				},
			);

			vnode.appContext = nuxtApp.vueApp._context;
			render(vnode, container);

			// 保持引用以便销毁
			el._tooltipVnode = vnode;
			el._tooltipContainer = container;
		},

		updated(el, binding) {
			if (el._tooltipContainer && binding.value !== binding.oldValue) {
				const text = binding.value;
				if (!text) {
					render(null, el._tooltipContainer);
					return;
				}

				// 重新渲染以更新属性
				const vnode = h(
					VTooltip,
					{
						activator: el,
						location: binding.arg || 'bottom',
						eager: true,
						maxWidth: '400px',
						contentClass: 'custom-tooltip-box',
					},
					{
						default: () => text,
					},
				);
				vnode.appContext = nuxtApp.vueApp._context;
				render(vnode, el._tooltipContainer);
				el._tooltipVnode = vnode;
			}
		},

		unmounted(el) {
			if (el._tooltipContainer) {
				render(null, el._tooltipContainer);
				el._tooltipContainer.remove();
			}
		},
	});
});
