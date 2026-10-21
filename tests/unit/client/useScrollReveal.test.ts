// @vitest-environment happy-dom
import { createApp, h, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollReveal } from '~/composables/useScrollReveal';

let dispose: (() => void) | undefined;
afterEach(() => {
	dispose?.();
	dispose = undefined;
	vi.restoreAllMocks();
	document.body.innerHTML = '';
});

describe('阅读控制栏滚动显隐', () => {
	it('下滚隐藏、往回滚显示，点按显示后仍能下滚收起', () => {
		let y = 0;
		vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y);
		let visible: ReturnType<typeof useScrollReveal>;
		const app = createApp({
			setup() {
				visible = useScrollReveal();
				return () => h('div');
			},
		});
		const host = document.createElement('div');
		document.body.append(host);
		app.mount(host);
		dispose = () => app.unmount();
		const scroll = (next: number) => {
			y = next;
			window.dispatchEvent(new Event('scroll'));
		};
		scroll(200);
		expect(visible!.value).toBe(false);
		scroll(180);
		expect(visible!.value).toBe(true);
		scroll(182);
		expect(visible!.value).toBe(true);
		scroll(205);
		expect(visible!.value).toBe(false);
		visible!.value = true;
		scroll(230);
		expect(visible!.value).toBe(false);
	});

	it('卸载后不再响应滚动', () => {
		let y = 100;
		vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y);
		let visible: ReturnType<typeof useScrollReveal>;
		const app = createApp({
			setup() {
				visible = useScrollReveal();
				return () => h('div');
			},
		});
		app.mount(document.createElement('div'));
		app.unmount();
		y = 50;
		window.dispatchEvent(new Event('scroll'));
		expect(visible!.value).toBe(false);
	});
	it('导航在顶部或搜索展开时保持显示，关闭搜索后继续按滚动方向切换', () => {
		let y = 100;
		vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y);
		const searching = ref(false);
		let visible: ReturnType<typeof useScrollReveal>;
		const app = createApp({
			setup() {
				visible = useScrollReveal(true, {
					showAtTop: 64,
					alwaysVisible: searching,
				});
				return () => h('div');
			},
		});
		app.mount(document.createElement('div'));
		dispose = () => app.unmount();
		const scroll = (value: number) => {
			y = value;
			window.dispatchEvent(new Event('scroll'));
		};
		scroll(200);
		expect(visible!.value).toBe(false);
		scroll(10);
		expect(visible!.value).toBe(true);
		searching.value = true;
		scroll(300);
		expect(visible!.value).toBe(true);
		searching.value = false;
		scroll(320);
		expect(visible!.value).toBe(false);
	});
});
