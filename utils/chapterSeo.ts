/** 保留已有章节编号，仅为没有编号的漫画章节补充话数。 */
export function formatChapterTitle(title: string | undefined, no: number, type: 'manga' | 'novel'): string {
	const name = title?.trim() || '';
	if (!name) return type === 'manga' ? `第${no}话` : `第${no}章`;
	if (type === 'novel' || /^第.+?[话話章回卷节節集]/u.test(name)) return name;
	return `第${no}话 ${name}`;
}
