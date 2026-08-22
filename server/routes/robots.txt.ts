export default defineEventHandler((event) => {
	const config = useRuntimeConfig(event);
	const configuredUrl = config.public.siteUrl?.trim();
	const origin = (configuredUrl || getRequestURL(event).origin).replace(
		/\/$/,
		'',
	);

	setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');
	setResponseHeader(event, 'cache-control', 'public, max-age=3600');

	return [
		'User-agent: *',
		'Allow: /',
		'Disallow: /admin/',
		'Disallow: /login',
		'Disallow: /api/',
		`Sitemap: ${origin}/sitemap.xml`,
		'',
	].join('\n');
});
