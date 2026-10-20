// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { compileStyle, parse } from 'vue/compiler-sfc';

function componentStyles(file: string, id: string) {
	const source = readFileSync(resolve('components/common', file), 'utf8');
	return parse(source).descriptor.styles.map((style) =>
		compileStyle({ source: style.content, filename: file, id, scoped: true }).code,
	).join('\n');
}

const shelfStyles = componentStyles('BookshelfDisplay.vue', 'data-v-shelf');
const bookmarkStyles = componentStyles('ShelfBookmark.vue', 'data-v-bookmark');

afterEach(() => {
	document.head.innerHTML = '';
	document.body.innerHTML = '';
});

describe('书架书签定位', () => {
	it.each([
		['书签样式后加载', [shelfStyles, bookmarkStyles]],
		['书架样式后加载', [bookmarkStyles, shelfStyles]],
	])('%s时仍脱离排版流', (_, styles) => {
		for (const css of styles) {
			const style = document.createElement('style');
			style.textContent = css;
			document.head.append(style);
		}
		document.body.innerHTML = `<div class="shelf-display" data-v-shelf>
			<div class="bookshelf" data-v-shelf>
				<div class="cards-grid" data-v-shelf>
					<div class="shelf-books-grid" data-v-shelf>
						<div class="book-col" data-v-shelf>
							<a class="bookmark shelf-bookmark" data-v-shelf data-v-bookmark></a>
						</div>
					</div>
				</div>
			</div>
		</div>`;
		const bookmark = document.querySelector('.shelf-bookmark');
		if (!bookmark) throw new Error('缺少书签测试元素');
		expect(getComputedStyle(bookmark).position).toBe('absolute');
	});
});


describe('书架封面尺寸', () => {
	const bookStyles = componentStyles('Book3D.vue', 'data-v-book');
	it.each([
		['书本样式后加载', [shelfStyles, bookStyles]],
		['书架样式后加载', [bookStyles, shelfStyles]],
	])('%s时不额外缩减封面宽度', (_, styles) => {
		for (const css of styles) {
			const style = document.createElement('style');
			style.textContent = css;
			document.head.append(style);
		}
		document.body.innerHTML = `<div class="bookshelf" data-v-shelf>
			<div class="my-card" data-v-shelf>
				<div class="book-3d-container book-3d-home" data-v-shelf data-v-book>
					<div class="book-3d-wrapper" data-v-book></div>
				</div>
			</div>
		</div>`;
		const wrapper = document.querySelector('.book-3d-wrapper');
		if (!wrapper) throw new Error('缺少封面测试元素');
		expect(getComputedStyle(wrapper).maxWidth).toBe('100%');
	});
});
