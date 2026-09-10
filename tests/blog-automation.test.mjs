import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleSchema, readJson, validateArticle, verifySources, sourceUrls, callOpenAI, responseText, localDate, cadenceReason, jsonForHtml, checkSourceCopying } from '../scripts/blog-lib.mjs';
import { generate } from '../scripts/blog-generate.mjs';
import { renderBlogs, renderArticle } from '../scripts/blog-render.mjs';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const config = await readJson(join(repo, 'content/blog-config.json'));
const images = await readJson(join(repo, 'content/blog-images.json'));
const now = new Date('2026-09-09T03:30:00Z');
const sourceA = { url: 'https://www.livspace.com/in/magazine/storage-notes', title: 'Planning storage', publishedOn: '2026-09-03', supportingExcerpt: 'Plan storage around the items you use every day' };
const sourceB = { url: 'https://www.ikea.com/in/en/ideas/wardrobes/', title: 'Wardrobe planning', publishedOn: null, supportingExcerpt: 'Measure the room before you choose your wardrobe' };
const consulted = new Set([sourceA.url, sourceB.url, 'https://www.homelane.com/design-ideas/wardrobes/']);
const sourceHtml = (source) => `<html><head><script type="application/ld+json">${JSON.stringify({ '@type': 'BlogPosting', url: source.url, datePublished: source.publishedOn })}</script></head><body><article><p>${source.supportingExcerpt}</p><p>Choose adjustable shelves for items with different heights.</p></article></body></html>`;
const sourceFetch = async (url) => new Response(sourceHtml(url === sourceA.url ? sourceA : sourceB), { headers: { 'content-type': 'text/html' } });

function article() {
  const paragraph = 'Start by listing the things that need a place in your Chennai home. Keep everyday items within comfortable reach and set aside a separate shelf for pieces used only occasionally. Measure the room with the doors open, then check where people walk between the bed and the wardrobe. A useful interior plan leaves space for those movements before adding extra cabinets. Take the list to your designer and compare two layouts on the same floor plan. Ask how the shelves can be moved if your needs change later. Choose finishes after the layout is settled, and look at a sample in the room where it will be installed. This gives you a clearer way to compare the options without buying more storage than you need. Write down the agreed cabinet dimensions and check them against the available wall before ordering. Keep installation access and future maintenance in the discussion as well.';
  return { slug: 'wardrobe-storage-before-ordering', title: 'What to measure before ordering a wardrobe', description: 'Plan wardrobe storage for your Chennai home with a clear checklist for room measurements, everyday access and useful adjustable shelves.', category: 'Storage', topic: 'wardrobe planning', whyNow: 'Recent competitor coverage leaves measurement decisions unexplained.', competitorGap: 'Explain the homeowner decisions before ordering.', imageId: images[1].id, intro: ['A wardrobe works best when it fits both the room and the things you use. Start with a list before choosing the cabinet finish.'], sections: Array.from({ length: 4 }, (_, i) => ({ heading: ['List what needs a home', 'Measure the room first', 'Check daily access', 'Agree on the layout'][i], paragraphs: [paragraph], bullets: ['Write down the measurements and discuss access with your installer.'], sourceUrls: [i % 2 ? sourceB.url : sourceA.url] })), sources: [sourceA, sourceB], internalLinks: config.internalLinks.slice(0, 2) };
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'alankaar-journal-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ['content/posts', 'content/research', 'blog', 'img/portfolio']) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, 'content/blog-config.json'), JSON.stringify(config));
  await writeFile(join(root, 'content/blog-images.json'), JSON.stringify(images));
  for (const image of images) {
    const path = join(root, image.path.slice(1));
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, 'test-image');
  }
  await writeFile(join(root, 'blogs.html'), '<main><article>Existing guide</article><!-- GENERATED_BLOG_CARDS_START -->\n<!-- GENERATED_BLOG_CARDS_END --></main>');
  await writeFile(join(root, 'sitemap.xml'), '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://alankaarinteriors.com/</loc></url></urlset>');
  return root;
}

function apiResponse(value, research = false) {
  return { id: 'resp_test', status: 'completed', output: [...(research ? [{ type: 'web_search_call', action: { sources: [...consulted].map((url) => ({ type: 'url', url })) } }] : []), { type: 'message', content: [{ type: 'output_text', text: typeof value === 'string' ? value : JSON.stringify(value), annotations: [] }] }] };
}

test('cadence uses India dates, permits three weekly slots and keeps daily cap for manual runs', () => {
  assert.equal(localDate(new Date('2026-09-08T20:00:00Z')), '2026-09-09');
  assert.equal(cadenceReason([], config, now), null);
  assert.match(cadenceReason([], config, new Date('2026-09-10T03:30:00Z')), /Not a scheduled/);
  assert.match(cadenceReason([{ createdOn: '2026-09-09' }], config, now, true), /already exists/);
  assert.match(cadenceReason(['07', '08', '09'].map((d) => ({ createdOn: `2026-09-${d}` })), config, new Date('2026-09-11T03:30:00Z')), /Weekly/);
});

test('dry run validates real manifest with no network or file writes', async (t) => {
  const root = await fixture(t);
  const result = await generate({ root, now, dryRun: true, fetchImpl: () => { throw new Error('Network must not run'); } });
  assert.equal(result.apiCalls, 0); assert.equal(result.filesWritten, 0); assert.equal(result.eligible, true);
  assert.deepEqual(await readdir(join(root, 'content/posts')), []);
});

test('quality gate rejects unsafe slugs, fabricated claims, duplicate topics and malicious links', () => {
  assert.ok(validateArticle(article(), config, images).words >= 650);
  for (const [change, expected] of [
    [{ slug: '../../escape' }, /slug/],
    [{ intro: ['Our clients love our guaranteed results.'] }, /claim/],
    [{ sources: [{ ...sourceA, url: 'javascript:alert(1)' }, sourceB] }, /allowlisted/],
    [{ internalLinks: [{ url: 'https://evil.example/', label: 'More' }] }, /approved internal/]
  ]) assert.throws(() => validateArticle({ ...article(), ...change }, config, images), expected);
  assert.throws(() => validateArticle(article(), config, images, [article()]), /already exists/);
  assert.throws(() => validateArticle({ ...article(), slug: 'different-slug', title: 'What to measure before ordering your wardrobe' }, config, images, [article()]), /similar/);
});

test('sources require live research provenance and verified recent dates', async () => {
  const verified = await verifySources([sourceA, sourceB], consulted, config, { now, fetchImpl: sourceFetch });
  assert.equal(verified[0].fresh, true); assert.equal(verified[1].fresh, false);
  await assert.rejects(verifySources([sourceA, sourceB], new Set([sourceB.url]), config, { now, fetchImpl: sourceFetch }), /not returned by live research/);
  await assert.rejects(verifySources([{ ...sourceA, publishedOn: '2026-09-08' }, sourceB], consulted, config, { now, fetchImpl: sourceFetch }), /date could not be verified/);
  await assert.rejects(verifySources([{ ...sourceA, supportingExcerpt: 'This invented statement has never appeared on the page' }, sourceB], consulted, config, { now, fetchImpl: sourceFetch }), /excerpt/);
  await assert.rejects(verifySources([sourceA, sourceB], consulted, config, { now: new Date('2027-04-01'), fetchImpl: sourceFetch }), /recent/);
});

test('source fetching refuses redirects to untrusted or local hosts', async () => {
  let calls = 0;
  await assert.rejects(verifySources([sourceA, sourceB], consulted, config, { now, fetchImpl: async () => { calls++; return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secrets' } }); } }), /allowlisted/);
  assert.equal(calls, 1);
});

test('API failures and refusals fail closed without exposing credentials', async () => {
  await assert.rejects(callOpenAI({}, { apiKey: 'secret-never-printed', fetchImpl: async () => new Response('private details', { status: 401 }) }), (error) => /HTTP 401/.test(error.message) && !/private|secret/.test(error.message));
  assert.throws(() => responseText({ status: 'incomplete', output: [] }), /did not complete/);
  assert.throws(() => responseText({ status: 'completed', output: [{ content: [{ type: 'refusal' }] }] }), /declined/);
  assert.equal(sourceUrls(apiResponse('research', true)).size, 3);
});

test('complete mocked API run researches, verifies, reviews and writes one candidate with provenance', async (t) => {
  const root = await fixture(t); let apiCalls = 0;
  const fetchImpl = async (url, options) => {
    if (url !== 'https://api.openai.com/v1/responses') return sourceFetch(url);
    const request = JSON.parse(options.body); apiCalls++;
    assert.equal(request.store, false);
    if (apiCalls === 1) { assert.equal(request.tools[0].type, 'web_search'); return Response.json(apiResponse('Research supports practical wardrobe measurements.', true)); }
    if (apiCalls === 2) { assert.deepEqual(request.text.format.schema, articleSchema); return Response.json(apiResponse(article())); }
    return Response.json(apiResponse({ approved: true, issues: [] }));
  };
  const result = await generate({ root, now, apiKey: 'test-key', fetchImpl });
  assert.equal(result.generated, true); assert.equal(apiCalls, 3);
  const post = await readJson(join(root, 'content/posts', `${result.slug}.json`));
  assert.equal(post.automation.humanReviewRequired, true); assert.ok(post.image.provenance);
  const second = await generate({ root, now, apiKey: 'test-key', fetchImpl });
  assert.equal(second.skipped, true); assert.equal(apiCalls, 3);
});

test('failed editorial review writes no article or research files', async (t) => {
  const root = await fixture(t); let calls = 0;
  const fetchImpl = async (url) => {
    if (url !== 'https://api.openai.com/v1/responses') return sourceFetch(url);
    calls++;
    return Response.json(calls === 1 ? apiResponse('Evidence brief', true) : calls === 2 ? apiResponse(article()) : apiResponse({ approved: false, issues: ['Unsupported material claim.'] }));
  };
  await assert.rejects(generate({ root, now, apiKey: 'test', fetchImpl }), /Editorial quality gate/);
  assert.deepEqual(await readdir(join(root, 'content/posts')), []);
  assert.deepEqual(await readdir(join(root, 'content/research')), []);
});

test('renderer is idempotent and preserves existing cards and sitemap URLs', async (t) => {
  const root = await fixture(t); const post = { ...article(), createdOn: '2026-09-09', status: 'ready' };
  await writeFile(join(root, 'content/posts', `${post.slug}.json`), JSON.stringify(post));
  await renderBlogs({ root });
  const first = await readFile(join(root, 'blogs.html'), 'utf8'); const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  await renderBlogs({ root });
  assert.equal(await readFile(join(root, 'blogs.html'), 'utf8'), first);
  assert.equal(await readFile(join(root, 'sitemap.xml'), 'utf8'), sitemap);
  assert.match(first, /Existing guide/); assert.match(sitemap, /<loc>https:\/\/alankaarinteriors.com\/<\/loc>/);
  const html = await readFile(join(root, 'blog', post.slug, 'index.html'), 'utf8');
  assert.equal((html.match(/<h1>/g) ?? []).length, 1); assert.match(html, /BlogPosting/); assert.match(html, /Design reference|design reference/);
});

test('renderer refuses to overwrite a manually maintained guide', async (t) => {
  const root = await fixture(t); const post = { ...article(), createdOn: '2026-09-09', status: 'ready' };
  await writeFile(join(root, 'content/posts', `${post.slug}.json`), JSON.stringify(post));
  await mkdir(join(root, 'blog', post.slug)); await writeFile(join(root, 'blog', post.slug, 'index.html'), 'Hand-written guide');
  await assert.rejects(renderBlogs({ root }), /Refusing to overwrite/);
  assert.equal(await readFile(join(root, 'blog', post.slug, 'index.html'), 'utf8'), 'Hand-written guide');
});

test('HTML and JSON-LD escape untrusted text', () => {
  const post = { ...article(), createdOn: '2026-09-09', title: '<img src=x onerror=alert(1)>', description: '"><script>alert(2)</script>' };
  const html = renderArticle(post, config, images[0]);
  assert.ok(!html.includes('<img src=x')); assert.ok(!html.includes('<script>alert(2)'));
  assert.equal(jsonForHtml({ x: '</script>' }), '{"x":"\\u003c/script>"}');
});

test('source-copy gate rejects a copied passage while allowing short shared terms', () => {
  assert.throws(() => checkSourceCopying(article(), [{ pageText: article().sections[0].paragraphs[0] }]), /verbatim passage/);
  assert.doesNotThrow(() => checkSourceCopying(article(), [{ pageText: 'wardrobe storage and kitchen planning in Chennai' }]));
});

test('freshness rejects sidebar dates and JSON-LD belonging to a different article', async () => {
  const oldArticle = sourceHtml({ ...sourceA, publishedOn: '2020-01-02' });
  const sidebarVariants = [
    '<aside><time datetime="2026-09-03">Latest stories</time></aside>',
    `<aside><script type="application/ld+json">${JSON.stringify({ '@type': 'BlogPosting', url: 'https://www.livspace.com/in/magazine/a-different-article', datePublished: '2026-09-03' })}</script></aside>`,
    '<aside><script type="application/json">{"dateModified":"2026-09-03"}</script></aside>',
    '<aside><meta property="article:published_time" content="2026-09-03"></aside>'
  ];
  for (const sidebar of sidebarVariants) {
    const fetchImpl = async (url) => url === sourceA.url ? new Response(oldArticle.replace('</body>', `${sidebar}</body>`), { headers: { 'content-type': 'text/html' } }) : sourceFetch(url);
    await assert.rejects(verifySources([sourceA, sourceB], consulted, config, { now, fetchImpl }), /date could not be verified/);
    await assert.rejects(verifySources([{ ...sourceA, publishedOn: '2020-01-02' }, sourceB], consulted, config, { now, fetchImpl }), /recent publication/);
  }
});

test('freshness accepts canonical page Article JSON-LD and head article metadata', async () => {
  const canonical = 'https://www.livspace.com/in/magazine/canonical-storage';
  const variants = [
    `<link rel="canonical" href="${canonical}"><script type="application/ld+json">${JSON.stringify({ '@graph': [{ '@type': 'BlogPosting', mainEntityOfPage: { '@id': canonical }, dateModified: '2026-09-03T10:00:00+05:30' }, { '@type': 'BlogPosting', url: 'https://www.livspace.com/in/magazine/other', dateModified: '2026-09-08' }] })}</script>`,
    `<link rel="canonical" href="${sourceA.url}"><meta content="2026-09-03T10:00:00+05:30" property="article:published_time">`
  ];
  for (const metadata of variants) {
    const fetchImpl = async (url) => url === sourceA.url ? new Response(`<html><head>${metadata}</head><body><article>${sourceA.supportingExcerpt}</article></body></html>`, { headers: { 'content-type': 'text/html' } }) : sourceFetch(url);
    assert.equal((await verifySources([sourceA, sourceB], consulted, config, { now, fetchImpl }))[0].fresh, true);
  }
});

test('long navigation cannot hide copied article text or displace editor evidence', async () => {
  const copied = article().sections[0].paragraphs[0];
  const longHtml = sourceHtml(sourceA).replace('<body>', `<body><nav>${'Navigation links and category menus. '.repeat(1600)}</nav>`).replace('</article>', `<p>${copied}</p></article>`);
  const fetchImpl = async (url) => url === sourceA.url ? new Response(longHtml, { headers: { 'content-type': 'text/html' } }) : sourceFetch(url);
  const sources = await verifySources([sourceA, sourceB], consulted, config, { now, fetchImpl });
  assert.ok(sources[0].pageText.length > 30_000);
  assert.ok(sources[0].pageText.includes(copied));
  assert.ok(sources[0].evidenceText.includes(sourceA.supportingExcerpt));
  assert.ok(sources[0].evidenceText.includes(copied));
  assert.ok(!sources[0].evidenceText.includes('Navigation links'));
  assert.throws(() => checkSourceCopying(article(), sources), /verbatim passage/);
});

test('editor receives checked excerpt even when there is no article wrapper and evidence is late in a large page', async (t) => {
  const root = await fixture(t); let requests = 0;
  const lateSource = sourceHtml(sourceA).replace(/<\/?article>/g, '').replace('<body>', `<body><nav>${'Early navigation items. '.repeat(2000)}</nav>`);
  const fetchImpl = async (url, options) => {
    if (url !== 'https://api.openai.com/v1/responses') return url === sourceA.url ? new Response(lateSource, { headers: { 'content-type': 'text/html' } }) : sourceFetch(url);
    requests++;
    if (requests === 1) return Response.json(apiResponse('Research brief', true));
    if (requests === 2) return Response.json(apiResponse(article()));
    const request = JSON.parse(options.body);
    const evidence = JSON.parse(request.input.split('\nFetched evidence: ')[1]);
    assert.ok(evidence[0].evidenceText.includes(sourceA.supportingExcerpt));
    assert.ok(evidence[0].evidenceText.length < 31_000);
    assert.equal(evidence[0].finalUrl, sourceA.url);
    return Response.json(apiResponse({ approved: true, issues: [] }));
  };
  assert.equal((await generate({ root, now, apiKey: 'test', fetchImpl })).generated, true);
  const research = await readJson(join(root, 'content/research', `2026-09-09-${article().slug}.json`));
  assert.ok(!('pageText' in research.sources[0]) && !('evidenceText' in research.sources[0]));
});

test('redirects cannot create false source independence or turn a competitor into a primary source', async () => {
  for (const destination of [sourceA.url, 'https://www.homelane.com/design-ideas/redirected-story/']) {
    const fetchImpl = async (url) => {
      if (url === sourceB.url) return new Response(null, { status: 302, headers: { location: destination } });
      const html = sourceHtml(sourceA).replace('</article>', `<p>${sourceB.supportingExcerpt}</p></article>`);
      return new Response(html, { headers: { 'content-type': 'text/html' } });
    };
    await assert.rejects(verifySources([sourceA, sourceB], consulted, config, { now, fetchImpl }), destination === sourceA.url ? /independent final source domains/ : /primary source at its final destination/);
  }
});
