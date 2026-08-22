import { Status } from '_db';

const escapeXml = (value: string) =>
	value.replace(/[<>&'\"]/g, (character) => {
		const entities: Record<string, string> = {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;',
			"'": '&apos;',
			'"': '&quot;',
		};
		return entities[character];
	});

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig(event);
	const configuredUrl = config.public.siteUrl?.trim();
	const origin = (configuredUrl || getRequestURL(event).origin).replace(
		/\/$/,
		'',
	);

	const [works, tags] = await Promise.all([
		useDB().work.findMany({
			where: { status: Status.Enable, deleted_at: null },
			select: {
				id: true,
				content_type: true,
				created_at: true,
				updated_at: true,
			},
			orderBy: { updated_at: 'desc' },
		}),
		useDB().tag.findMany({
			where: { deleted_at: null },
			select: { id: true, updated_at: true, created_at: true },
		}),
	]);

	const staticRoutes = ['/manga', '/novel', '/classify'];
	const entries = [
		...staticRoutes.map((path) => ({ path, lastmod: undefined })),
		...works.map((work) => ({
			path: `/${work.content_type === 'Manga' ? 'manga' : 'novel'}/${work.id}`,
			lastmod: work.updated_at || work.created_at,
		})),
		...tags.map((tag) => ({
			path: `/classify/${tag.id}`,
			lastmod: tag.updated_at || tag.created_at,
		})),
	];

	const urls = entries
		.map(({ path, lastmod }) => {
			const lastmodElement = lastmod
				? `<lastmod>${lastmod.toISOString()}</lastmod>`
				: '';
			return `<url><loc>${escapeXml(`${origin}${path}`)}</loc>${lastmodElement}</url>`;
		})
		.join('');

	setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8');
	setResponseHeader(event, 'cache-control', 'public, max-age=3600');

	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
});
