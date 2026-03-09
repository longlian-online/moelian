/**
 * v-copy 自定义指令
 * 用于实现元素内容的快捷复制
 * 默认行为：右键点击元素时，复制指令绑定的值或元素内部文本
 */
export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.directive('copy', {
		/**
		 * 当指令绑定到元素并挂载到 DOM 时触发
		 * @param el 绑定指令的 DOM 元素
		 * @param binding 包含指令参数、绑定值等信息的对象
		 */
		mounted(el, binding) {
			// 使用项目中已有的剪贴板工具函数
			const { copyText } = useClipboard();

			/**
			 * 复制事件处理函数
			 * @param e 鼠标事件
			 */
			const handleCopy = async (e: MouseEvent) => {
				// 阻止默认的右键菜单弹出
				e.preventDefault();
				// 阻止事件冒泡，避免触发父元素的点击跳转等事件
				e.stopPropagation();

				// 复制内容的优先级：
				// 1. 指令绑定的具体值 v-copy="'text'"
				// 2. 元素的 innerText
				// 3. 元素的 textContent
				const textToCopy = binding.value || el.innerText || el.textContent;

				if (textToCopy) {
					await copyText(textToCopy);
				}
			};

			// 将处理函数挂载到 el 上，方便在 unmounted 时移除
			el._copyHandler = handleCopy;

			// 监听右键菜单事件
			el.addEventListener('contextmenu', handleCopy);
		},

		/**
		 * 当指令与元素解绑且元素即将从 DOM 中移除时触发
		 * 清理事件监听器，防止内存泄漏
		 */
		unmounted(el) {
			if (el._copyHandler) {
				el.removeEventListener('contextmenu', el._copyHandler);
			}
		},
	});
});
