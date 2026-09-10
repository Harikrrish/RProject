import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { articleSchema, readJson, readPosts, escapeHtml as e, jsonForHtml, validateArticle } from './blog-lib.mjs';

const marker = '<!-- GENERATED_JOURNAL_ARTICLE -->';
const cardStart = '<!-- GENERATED_BLOG_CARDS_START -->';
const cardEnd = '<!-- GENERATED_BLOG_CARDS_END -->';
const sitemapStart = '<!-- GENERATED_BLOG_URLS_START -->';
const sitemapEnd = '<!-- GENERATED_BLOG_URLS_END -->';

export function renderArticle(post, config, image) {
  const url = `${config.business.siteUrl}/blog/${post.slug}/`;
  const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.description, datePublished: post.createdOn, dateModified: post.updatedOn ?? post.createdOn, inLanguage: 'en-IN', mainEntityOfPage: url, image: config.business.siteUrl + image.path, author: { '@type': 'Organization', name: config.business.name, url: config.business.siteUrl }, publisher: { '@type': 'Organization', name: config.business.name, logo: { '@type': 'ImageObject', url: `${config.business.siteUrl}/img/logo/logo-A.png` } } };
  const sectionHtml = post.sections.map((section, i) => `<section id="section-${i + 1}"><h2>${e(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${e(p)}</p>`).join('\n')}${section.bullets.length ? `<ul>${section.bullets.map((p) => `<li>${e(p)}</li>`).join('')}</ul>` : ''}<p class="article-meta">References: ${section.sourceUrls.map((url) => `<a href="${e(url)}" rel="noopener noreferrer">${e(post.sources.find((s) => s.url === url)?.title ?? 'Source')}</a>`).join(' · ')}</p></section>`).join('\n');
  return `<!doctype html>
${marker}
<html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(post.title)} | Alankaar Interiors</title><meta name="description" content="${e(post.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${e(url)}">
<meta property="og:type" content="article"><meta property="og:title" content="${e(post.title)}"><meta property="og:description" content="${e(post.description)}"><meta property="og:url" content="${e(url)}"><meta property="og:image" content="${e(config.business.siteUrl + image.path)}"><meta property="og:image:alt" content="${e(image.alt)}"><meta property="og:site_name" content="Alankaar Interiors"><meta property="article:published_time" content="${e(post.createdOn)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(post.title)}"><meta name="twitter:description" content="${e(post.description)}"><meta name="twitter:image" content="${e(config.business.siteUrl + image.path)}">
<link rel="icon" href="/img/logo/logo-A.png"><link rel="stylesheet" href="/css/site.css"><link rel="stylesheet" href="/css/studio.css"><link rel="stylesheet" href="/css/journal.css"><script type="application/ld+json">${jsonForHtml(schema)}</script><script src="/js/site.js" defer></script></head>
<body class="journal-page article-page"><a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="container header-inner"><a class="brand" href="/" aria-label="Alankaar Interiors home"><img class="brand-mark" src="/img/logo/logo-A.png" alt="" width="40" height="52"><span class="brand-name">ALANKAAR<small>INTERIORS</small></span></a><a class="header-phone" href="tel:+919994958369" aria-label="Call Alankaar Interiors on +91 99949 58369"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m7 3 3 5-2 2c1 3 3 5 6 6l2-2 5 3c-1 4-3 5-7 3C7 17 3 12 3 7c0-2 2-4 4-4Z"/></svg><span><small>Let’s talk about your space</small>+91 99949 58369</span></a><button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="site-nav"><span></span><span></span></button><nav class="site-nav" id="site-nav" aria-label="Main navigation"><a href="/#ourdesign">Our work</a><a href="/#services">What we do</a><a href="/#virtual-studio">360° studio</a><a href="/blogs.html">Journal</a><a class="button button-primary nav-cta" href="/#contact">Let’s talk <span aria-hidden="true">↗</span></a></nav></div></header>
<main id="main"><div class="container"><header class="article-header"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blogs.html">Journal</a></nav><p class="eyebrow">${e(post.category)}</p><h1>${e(post.title)}</h1><p class="article-meta">Alankaar Interiors · <time datetime="${e(post.createdOn)}">${e(new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${post.createdOn}T00:00:00Z`)))}</time> · ${Math.ceil(post.sections.reduce((n, s) => n + s.paragraphs.join(' ').split(/\s+/).length, 0) / 200)} min read</p></header>
<figure class="article-cover"><img src="${e(image.path)}" alt="${e(image.alt)}" width="1200" height="800" fetchpriority="high"><figcaption>${e(image.caption)} ${image.credit !== 'Existing Alankaar Interiors website gallery' ? e(image.credit) : ''}</figcaption></figure>
<div class="article-layout"><article class="article-body">${post.intro.map((p) => `<p>${e(p)}</p>`).join('\n')}${sectionHtml}<section class="article-callout"><h2>Talk through your home plans</h2><p>Share your floor plan, priorities and the rooms you want to work on. We can help you decide where to start.</p><a class="button button-primary" href="/#contact">Discuss your home</a></section><section class="article-sources"><h2>Sources and further reading</h2><ul>${post.sources.map((s) => `<li><a href="${e(s.url)}" rel="noopener noreferrer">${e(s.title)}</a>${s.publishedOn ? ` · Published or updated ${e(s.publishedOn)}` : ''}</li>`).join('')}</ul></section><section><h2>Keep planning</h2>${post.internalLinks.map((l) => `<p><a href="${e(l.url)}">${e(l.label)}</a></p>`).join('')}</section></article><aside class="article-aside"><nav class="article-toc" aria-label="On this page"><p class="eyebrow">On this page</p><ol>${post.sections.map((s, i) => `<li><a href="#section-${i + 1}">${e(s.heading)}</a></li>`).join('')}</ol></nav></aside></div></div></main>
<footer class="site-footer journal-footer"><div class="container journal-footer-inner"><div><a class="journal-wordmark" href="/">ALANKAAR INTERIORS</a><p>Thoughtful interiors. Made for the way you live.</p></div><div><a href="tel:${e(config.business.phone)}">+91 99949 58369</a><a href="mailto:alankaarinteriors@gmail.com">alankaarinteriors@gmail.com</a><p>Thuraipakkam, Chennai</p></div></div><div class="container journal-footer-bottom"><span>© Alankaar Interiors</span><a href="/blogs.html">The journal</a><a href="/#contact">Plan your home</a></div></footer></body></html>\n`;
}

export function renderCard(post, image) {
  return `<article class="blog-card"><a class="blog-card-image" href="/blog/${e(post.slug)}/" tabindex="-1" aria-hidden="true"><img src="${e(image.path)}" alt="" width="800" height="600" loading="lazy" decoding="async"></a><div class="blog-card-content"><span class="blog-category">${e(post.category)}</span><h2><a href="/blog/${e(post.slug)}/">${e(post.title)}</a></h2><p>${e(post.description)}</p><a class="read-more" href="/blog/${e(post.slug)}/" aria-label="Read ${e(post.title)}">Read the guide <span aria-hidden="true">↗</span></a></div></article>`;
}

export async function renderBlogs({ root = process.cwd() } = {}) {
  const config = await readJson(join(root, 'content/blog-config.json'));
  const images = await readJson(join(root, 'content/blog-images.json'));
  const posts = (await readPosts(root)).filter((post) => post.status === 'ready').sort((a, b) => b.createdOn.localeCompare(a.createdOn));
  // Validate every record and integration point before mutating any public file.
  const listingFile = join(root, 'blogs.html');
  const listing = await readFile(listingFile, 'utf8');
  if (!listing.includes(cardStart) || !listing.includes(cardEnd)) throw new Error('blogs.html is missing generated-card markers.');
  const sitemapFile = join(root, 'sitemap.xml');
  let sitemap = await readFile(sitemapFile, 'utf8');
  if (!sitemap.includes('</urlset>')) throw new Error('Expected a sitemap URL set.');
  for (const post of posts) {
    const core = Object.fromEntries(Object.keys(articleSchema.properties).map((key) => [key, post[key]]));
    validateArticle(core, config, images);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.createdOn) || !Number.isFinite(Date.parse(post.createdOn))) throw new Error('Article publication date is invalid.');
    const image = images.find((i) => i.id === post.imageId);
    if (!/^\/img\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g)$/.test(image.path) || image.path.includes('..')) throw new Error('Unsafe image path.');
    await access(join(root, image.path.slice(1)));
    try { const old = await readFile(join(root, 'blog', post.slug, 'index.html'), 'utf8'); if (!old.includes(marker)) throw new Error(`Refusing to overwrite existing guide ${post.slug}.`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const post of posts) {
    const directory = join(root, 'blog', post.slug);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'index.html'), renderArticle(post, config, images.find((i) => i.id === post.imageId)));
  }
  const start = listing.indexOf(cardStart) + cardStart.length; const end = listing.indexOf(cardEnd, start);
  if (end < start) throw new Error('Generated card markers are out of order.');
  await writeFile(listingFile, `${listing.slice(0, start)}\n${posts.map((p) => renderCard(p, images.find((i) => i.id === p.imageId))).join('\n')}\n${listing.slice(end)}`);
  const entries = `${sitemapStart}\n${posts.map((p) => `  <url><loc>${e(config.business.siteUrl)}/blog/${e(p.slug)}/</loc><lastmod>${e(p.updatedOn ?? p.createdOn)}</lastmod></url>`).join('\n')}\n${sitemapEnd}`;
  if (sitemap.includes(sitemapStart)) sitemap = sitemap.replace(new RegExp(`${sitemapStart}[\\s\\S]*?${sitemapEnd}`), entries);
  else sitemap = sitemap.replace('</urlset>', `${entries}\n</urlset>`);
  await writeFile(sitemapFile, sitemap);
  return { rendered: posts.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  renderBlogs().then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
