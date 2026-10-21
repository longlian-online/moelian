<template>
	<footer class="site-footer">
		<div class="footer-content">
			<div class="footer-main">
				<section class="footer-brand" aria-label="关于 moelian">
					<NavBrand compact />
					<h2>这一页读完了，下一页一起写。</h2>
					<div class="footer-illustrations" aria-hidden="true">
						<img
							v-for="(artwork, index) in footerArtwork"
							:key="index"
							:src="artwork"
							alt=""
							width="128"
							height="112"
						/>
					</div>
				</section>
				<nav class="footer-explore" aria-label="探索更多">
					<h3>探索更多</h3>
					<a
						v-for="channel in channels.slice(0, 2)"
						:key="channel.id"
						class="footer-social"
						:href="channel.url"
						target="_blank"
						rel="noopener noreferrer"
						:aria-label="`${channel.name}，扫码或点击访问`"
					>
						<span
							>{{ channel.label
							}}<span class="footer-arrow" aria-hidden="true">↗</span></span
						>
						<img
							:src="channel.qr"
							:alt="`${channel.name}二维码`"
							width="64"
							height="64"
						/>
					</a>
				</nav>
				<nav class="footer-participate" aria-label="一起参与">
					<h3>一起参与</h3>
					<a
						v-for="channel in channels.slice(2)"
						:key="channel.id"
						class="footer-invite"
						:href="channel.url"
						target="_blank"
						rel="noopener noreferrer"
						:aria-label="`${channel.name}，扫码或点击加入`"
					>
						<p v-if="channel.id === 'chat'">
							来聊聊喜欢的作品，<br />也欢迎投稿你的故事。
						</p>
						<p v-else>
							也欢迎和我们一起，<br /><strong>研究一辈子女女关系。</strong>
						</p>
						<img
							:src="channel.qr"
							:alt="`${channel.name}二维码`"
							width="72"
							height="72"
						/>
					</a>
				</nav>
			</div>
			<div class="footer-colophon">
				<span>© {{ year }} <strong>moelian</strong></span>
				<a
					href="https://beian.miit.gov.cn/"
					target="_blank"
					rel="noopener noreferrer"
					>粤ICP备2025414593号-1</a
				>
				<span
					>Powered by
					<a href="https://nuxt.com/" target="_blank" rel="noopener noreferrer"
						>Nuxt 4</a
					></span
				>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { publicAssets } from '~/utils/assets';
const pickArtwork = useRandomArtwork();
const firstArtwork = pickArtwork('footer-first');
const secondArtwork = pickArtwork('footer-second');
// 两张抽到同一原画时，顺取下一张，仍保持 SSR 与水合结果一致。
const nextArtwork = publicAssets.artworks[
	(publicAssets.artworks.indexOf(firstArtwork) + 1) % publicAssets.artworks.length
];
const footerArtwork = [
	firstArtwork,
	secondArtwork === firstArtwork ? nextArtwork : secondArtwork,
];
const year = useState('footer-year', () => new Date().getFullYear());
const channels = [
	{
		id: 'bilibili',
		label: 'bilibili',
		name: '夢怜龍華 · bilibili',
		url: 'https://space.bilibili.com/3546956804655680',
		qr: publicAssets.bilibiliQr,
	},
	{
		id: 'yamibo',
		label: '百合会',
		name: '夢怜龍華 · 百合会',
		url: 'https://bbs.yamibo.com/space-uid-664313.html',
		qr: publicAssets.yamiboQr,
	},
	{
		id: 'chat',
		label: '同好水群',
		name: '夢怜龍華水群区域',
		url: 'https://qm.qq.com/q/W9R7IrAdwY',
		qr: publicAssets.qqChatQr,
	},
	{
		id: 'join',
		label: '加入汉化组',
		name: '夢怜龍華组审核群',
		url: 'https://qm.qq.com/q/VruI3cSc0w',
		qr: publicAssets.qqJoinQr,
	},
];
</script>

<style scoped>
.site-footer {
	width: 100%;
	padding: 0;
	background: #eee3d3;
	color: #655043;
}
.footer-content {
	width: 100%;
	margin: 0;
	padding: 24px 36px 12px;
	background: #fffcf6;
	border: 1px solid #e7d7c0;
	border-top: 3px solid #df9462;
	border-radius: 0;
}
.footer-main {
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(180px, 0.7fr) minmax(
			260px,
			1fr
		);
	gap: 28px;
	align-items: start;
	padding-bottom: 18px;
}
.footer-brand h2 {
	margin: 14px 0 0;
	font-family: 'Noto Serif SC', 'Songti SC', serif;
	font-size: clamp(17px, 1.8vw, 23px);
	white-space: nowrap;
	line-height: 1.6;
	font-weight: 500;
	color: #503e35;
}
.footer-illustrations {
	display: flex;
	align-items: flex-end;
	gap: 24px;
	margin-top: 8px;
	pointer-events: none;
}
.footer-illustrations img {
	display: block;
	width: 104px;
	height: 88px;
	object-fit: contain;
	mix-blend-mode: multiply;
	opacity: 0.82;
}
.footer-illustrations img:first-child {
	transform: rotate(-3deg);
}
.footer-illustrations img:last-child {
	transform: rotate(3deg);
}
.footer-main h3 {
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.1em;
	color: #94765f;
	margin: 2px 0 10px;
	line-height: 1.8;
}
.site-footer a {
	color: inherit;
	text-decoration: none;
}
.footer-social,
.footer-invite {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	min-height: 64px;
}
.footer-social > span {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex: 1;
	font-size: 16px;
}
.footer-arrow {
	color: #a58b76;
	font-size: 14px;
}
.footer-social img {
	width: 64px;
	height: 64px;
}
.footer-invite {
	min-height: 64px;
}
.footer-invite p {
	margin: 0;
	font-size: 14px;
	line-height: 1.85;
}
.footer-invite strong {
	font-weight: 600;
}
.footer-invite img {
	width: 64px;
	height: 64px;
}
.footer-social img,
.footer-invite img {
	display: block;
	flex-shrink: 0;
}
.site-footer a:hover {
	color: #a56843;
}
.site-footer a:focus-visible {
	outline: 2px solid #c7976d;
	outline-offset: 4px;
	border-radius: 3px;
}
.footer-colophon {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px 20px;
	padding-top: 12px;
	border-top: 1px solid #e8d9c4;
	color: #8e7867;
	font-size: 12px;
	line-height: 1.8;
}
.footer-colophon strong {
	font-weight: 500;
}
@media (max-width: 1000px) and (min-width: 701px) {
	.footer-content {
		padding-inline: 26px;
	}
	.footer-main {
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: 24px 36px;
	}
	.footer-brand {
		grid-column: 1 / -1;
	}
	.footer-brand h2 {
		margin-top: 12px;
	}
}
@media (max-width: 700px) {
	.footer-illustrations {
		gap: 20px;
		margin-top: 8px;
	}
	.footer-illustrations img {
		width: 88px;
		height: 72px;
	}
	.site-footer {
		padding: 0;
	}
	.footer-content {
		padding: 20px 20px 12px;
		border-radius: 0;
	}
	.footer-main {
		grid-template-columns: 1fr;
		gap: 18px;
		padding-bottom: 16px;
	}
	.footer-brand h2 {
		font-size: clamp(17px, 5vw, 21px);
		margin: 12px 0 0;
	}
	.footer-main h3 {
		margin: 0 0 8px;
		font-size: 13px;
	}
	.footer-social,
	.footer-invite {
		min-height: 64px;
	}
	.footer-social > span {
		font-size: 15px;
	}
	.footer-social img {
		width: 60px;
		height: 60px;
	}
	.footer-invite img {
		width: 60px;
		height: 60px;
	}
	.footer-invite p {
		font-size: 14px;
	}
	.footer-colophon {
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 5px;
		padding-top: 14px;
		font-size: 11px;
	}
	.footer-colophon > a {
		order: 0;
		width: 100%;
	}
}

@media (max-width: 700px) {
	.footer-explore,
	.footer-participate {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: 20px;
	}
	.footer-explore h3,
	.footer-participate h3 {
		grid-column: 1 / -1;
	}
	.footer-social {
		gap: 8px;
	}
	.footer-social > span {
		font-size: 14px;
		gap: 4px;
	}
	.footer-social img {
		width: 56px;
		height: 56px;
	}
	.footer-invite {
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 8px;
	}
	.footer-invite p {
		font-size: 13px;
		line-height: 1.8;
	}
	.footer-invite img {
		align-self: center;
	}
}
@media (max-width: 350px) {
	.footer-explore,
	.footer-participate {
		column-gap: 12px;
	}
	.footer-social > span {
		font-size: 13px;
	}
	.footer-invite p {
		font-size: 12px;
	}
}

@media (max-width: 700px) {
	.footer-brand,
	.footer-main h3,
	.footer-invite p {
		text-align: center;
	}
	.footer-illustrations {
		justify-content: center;
	}
	.footer-social {
		justify-content: center;
	}
	.footer-social > span {
		flex: 0 1 auto;
		justify-content: center;
	}
	.footer-colophon > * {
		width: 100%;
	}
}
</style>
