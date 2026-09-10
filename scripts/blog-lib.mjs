import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const text = { type: 'string' };
export const list = (items) => ({ type: 'array', items });
export const object = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const sourceSchema = object({ url: text, title: text, publishedOn: { type: ['string', 'null'] }, supportingExcerpt: text });
export const articleSchema = object({
  slug: text, title: text, description: text, category: text, topic: text,
  whyNow: text, competitorGap: text, imageId: text, intro: list(text),
  sections: list(object({ heading: text, paragraphs: list(text), bullets: list(text), sourceUrls: list(text) })),
  sources: list(sourceSchema), internalLinks: list(object({ url: text, label: text }))
});
export const reviewSchema = object({ approved: { type: 'boolean' }, issues: list(text) });
export const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
export const normalize = (value) => String(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const wordCount = (value) => normalize(value).split(/\s+/).filter(Boolean).length;
export const articleText = (post) => [post.title, ...post.intro, ...post.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...s.bullets])].join(' ');

export function assertShape(value, schema, path = 'article') {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (!types.includes(actual)) throw new Error(`${path}: expected ${types.join('/')}`);
  if (actual === 'object') {
    for (const key of schema.required) if (!(key in value)) throw new Error(`${path}.${key} is required`);
    for (const key of Object.keys(value)) {
      if (!(key in schema.properties)) throw new Error(`${path}.${key} is not allowed`);
      assertShape(value[key], schema.properties[key], `${path}.${key}`);
    }
  }
  if (actual === 'array') value.forEach((entry, i) => assertShape(entry, schema.items, `${path}[${i}]`));
}

export function localDate(now = new Date(), timezone = 'Asia/Kolkata') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function cadenceReason(posts, config, now = new Date(), manual = false) {
  const today = localDate(now, config.timezone);
  const day = new Intl.DateTimeFormat('en-US', { timeZone: config.timezone, weekday: 'short' }).format(now);
  if (!manual && !config.scheduleDays.includes(day)) return 'Not a scheduled publishing day.';
  if (posts.some((p) => p.createdOn === today)) return 'A candidate already exists for this local date.';
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const week = start.toISOString().slice(0, 10);
  if (posts.filter((p) => p.createdOn >= week && p.createdOn <= today).length >= config.maxPostsPerWeek) return 'Weekly article limit reached.';
  return null;
}

export async function readPosts(root) {
  const names = await readdir(join(root, 'content/posts'));
  return Promise.all(names.filter((n) => n.endsWith('.json')).sort().map((n) => readJson(join(root, 'content/posts', n))));
}

export function permittedUrl(raw, domains) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid source URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !domains.some((d) => url.hostname === d || url.hostname === `www.${d}` || url.hostname === `blog.${d}`)) {
    throw new Error(`Source host is not allowlisted: ${url.hostname}`);
  }
  return url;
}

export function sourceUrls(response) {
  const found = new Set();
  for (const item of response.output ?? []) {
    if (item.type === 'web_search_call') {
      for (const source of item.action?.sources ?? []) if (source.url) found.add(source.url);
    }
    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) if (annotation.type === 'url_citation' && annotation.url) found.add(annotation.url);
    }
  }
  return found;
}

export function responseText(response) {
  if (response.status !== 'completed') throw new Error(`API response did not complete: ${response.status}`);
  const messages = (response.output ?? []).flatMap((item) => item.content ?? []);
  if (messages.some((item) => item.type === 'refusal')) throw new Error('API declined to generate this content.');
  const result = messages.filter((item) => item.type === 'output_text').map((item) => item.text).join('\n');
  if (!result.trim()) throw new Error('API response contains no text.');
  return result;
}

export async function callOpenAI(body, { apiKey, fetchImpl = fetch } = {}) {
  if (!apiKey) throw new Error('Set OPENAI_API_KEY before running live generation.');
  // No automatic retry: avoid hidden duplicate spend on ambiguous timeouts.
  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ store: false, ...body }), signal: AbortSignal.timeout(180_000)
  });
  if (!response.ok) throw new Error(`OpenAI request failed (HTTP ${response.status}); check the API key, model access and project budget.`);
  const result = await response.json();
  responseText(result);
  return result;
}

function plainHtml(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp|quot|apos|#39);/g, ' ');
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((m) => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4]]));
}

function pageIdentity(raw, base) {
  try {
    const url = new URL(raw, base);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_')) url.searchParams.delete(key);
    return `${url.origin}${url.pathname.replace(/\/$/, '')}${url.search}`;
  } catch { return null; }
}

function pageDates(html, finalUrl) {
  const dates = new Set();
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const identities = new Set([pageIdentity(finalUrl)]);
  // A same-host canonical may legitimately remove a query or use a preferred path.
  for (const link of head.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(link[0]);
    if (attrs.rel?.toLowerCase() !== 'canonical' || !attrs.href) continue;
    try { const canonical = new URL(attrs.href, finalUrl); if (canonical.origin === new URL(finalUrl).origin) identities.add(pageIdentity(canonical.href)); } catch { /* Ignore malformed metadata. */ }
  }
  const addDate = (value) => { if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) dates.add(value.slice(0, 10)); };
  // Only head-level article metadata belongs to this page. Generic body time tags,
  // copyright dates, widgets and arbitrary JSON data must never supply freshness.
  for (const tag of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(tag[0]);
    if (['article:published_time', 'article:modified_time'].includes((attrs.property ?? attrs.name ?? '').toLowerCase())) addDate(attrs.content);
  }
  const tiedToPage = (node) => {
    const references = [node.url, node.mainEntityOfPage, node['@id']].flatMap((value) => Array.isArray(value) ? value : [value]);
    return references.some((value) => {
      const raw = typeof value === 'string' ? value : value?.['@id'] ?? value?.url;
      if (typeof raw !== 'string' || (raw.startsWith('#') && !/^#(?:article|blogposting|newsarticle|webpage)$/i.test(raw))) return false;
      return identities.has(pageIdentity(raw, finalUrl));
    });
  };
  const inspect = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(inspect); return; }
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some((type) => ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'Report'].includes(String(type).replace(/^https?:\/\/schema.org\//, ''))) && tiedToPage(value)) {
      addDate(value.datePublished); addDate(value.dateModified);
    }
    for (const nested of Object.values(value)) if (nested && typeof nested === 'object') inspect(nested);
  };
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attributes(script[1]).type?.toLowerCase() !== 'application/ld+json') continue;
    try { inspect(JSON.parse(script[2])); } catch { /* Invalid structured data cannot establish a date. */ }
  }
  return dates;
}

function editorEvidence(html, pageText, excerpt) {
  let content = pageText;
  // Prefer the article containing the checked excerpt; otherwise use main, then
  // a bounded window around the evidence, rather than the start of the document.
  for (const tag of ['article', 'main']) {
    const candidates = [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((m) => plainHtml(m[1].replace(/<(?:nav|aside|header|footer)\b[^>]*>[\s\S]*?<\/(?:nav|aside|header|footer)>/gi, ' ')).replace(/\s+/g, ' ').trim());
    const match = candidates.find((candidate) => normalize(candidate).includes(normalize(excerpt)));
    if (match) { content = match; break; }
  }
  content = content.normalize('NFKC');
  const terms = normalize(excerpt).split(' ').map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const match = content.match(new RegExp(terms.join('[^\\p{L}\\p{N}]+'), 'iu'));
  if (!match) throw new Error('Cannot locate verified excerpt in editor evidence.');
  const start = Math.max(0, Math.min(match.index - 10_000, content.length - 30_000));
  const window = content.slice(start, start + 30_000);
  if (!normalize(window).includes(normalize(excerpt))) throw new Error('Editor evidence window excludes the verified excerpt.');
  return `Verified excerpt from this page: ${excerpt}\nArticle evidence${content.length > 30_000 ? ' (excerpt-centred window)' : ''}:\n${window}`;
}

export async function verifySources(sources, discovered, config, { fetchImpl = fetch, now = new Date() } = {}) {
  const domains = [...config.competitors.map((c) => c.domain), ...config.primarySourceDomains];
  const canonical = (raw) => { const u = new URL(raw); u.hash = ''; for (const k of [...u.searchParams.keys()]) if (k.startsWith('utm_')) u.searchParams.delete(k); return u.href; };
  const consulted = new Set([...discovered].map(canonical));
  const verified = [];
  for (const source of sources) {
    let url = permittedUrl(source.url, domains);
    if (!consulted.has(canonical(url.href))) throw new Error(`Source was not returned by live research: ${url.hostname}`);
    let response;
    for (let redirect = 0; redirect < 4; redirect++) {
      response = await fetchImpl(url.href, { redirect: 'manual', signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'AlankaarEditorialSourceCheck/1.0', Accept: 'text/html' } });
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get('location');
      if (!location) throw new Error('Source redirect is missing a destination.');
      url = permittedUrl(new URL(location, url).href, domains);
    }
    if (!response?.ok) throw new Error(`Source unavailable: ${source.url}`);
    if (!/text\/html/i.test(response.headers.get('content-type') ?? '')) throw new Error('Source must be a readable HTML page.');
    if (Number(response.headers.get('content-length')) > 2_000_000) throw new Error('Source page exceeds size limit.');
    const reader = response.body.getReader();
    const chunks = []; let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > 2_000_000) throw new Error('Source page exceeds size limit.');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    const html = Buffer.concat(chunks).toString('utf8');
    const pageText = plainHtml(html).replace(/\s+/g, ' ').trim();
    const excerptWords = wordCount(source.supportingExcerpt);
    if (excerptWords < 6 || excerptWords > 20 || !normalize(pageText).includes(normalize(source.supportingExcerpt))) throw new Error(`Source excerpt could not be verified: ${source.url}`);
    const date = source.publishedOn;
    const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && pageDates(html, url.href).has(date);
    if (date && !validDate) throw new Error(`Publication/update date could not be verified: ${source.url}`);
    const age = validDate ? (now.getTime() - Date.parse(date)) / 86_400_000 : Infinity;
    if (age < 0) throw new Error('Source date is in the future.');
    verified.push({ ...source, checkedOn: localDate(now, config.timezone), finalUrl: url.href, fresh: age <= config.freshnessDays, pageText, evidenceText: editorEvidence(html, pageText, source.supportingExcerpt) });
  }
  const finalDomain = (source) => new URL(source.finalUrl).hostname.replace(/^(www\.|blog\.)/, '');
  if (new Set(verified.map(finalDomain)).size < 2) throw new Error('At least two independent final source domains are required.');
  if (!verified.some((s) => s.fresh)) throw new Error('No source has a verified recent publication/update date; skip this run.');
  if (!verified.some((s) => config.primarySourceDomains.includes(finalDomain(s)))) throw new Error('At least one primary source at its final destination is required.');
  if (!verified.some((s) => config.competitors.some((c) => finalDomain(s) === c.domain))) throw new Error('Competitor research at its final destination is required.');
  return verified;
}

export function validateArticle(post, config, images, existing = []) {
  assertShape(post, articleSchema);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || post.slug.length > 90) throw new Error('Article slug is unsafe or too long.');
  if (post.title.length < 25 || post.title.length > 80) throw new Error('Title must be 25–80 characters.');
  if (post.description.length < 110 || post.description.length > 165) throw new Error('Description must be 110–165 characters.');
  if (post.sections.length < 4 || post.sections.length > 8 || post.intro.length < 1) throw new Error('Use an introduction and 4–8 useful sections.');
  if (post.sections.some((s) => !s.heading.trim() || s.paragraphs.length < 1 || !s.sourceUrls.length)) throw new Error('Every section needs a heading, prose and source references.');
  const body = articleText(post);
  const words = wordCount(body);
  if (words < config.minWords || words > config.maxWords) throw new Error(`Article length ${words} is outside ${config.minWords}–${config.maxWords} words.`);
  if (!/chennai/i.test(body) || !/kitchen|interior|wardrobe|renovation|storage|lighting|ventilation/i.test(body)) throw new Error('Article must address Chennai interior needs.');
  if (/\b(delve|tapestry|elevate your|nestled|look no further|game.changer|unparalleled|in today's fast.paced|testament to)\b/i.test(body)) throw new Error('Replace generic promotional writing with plain advice.');
  if (/\b(our clients?|we (?:completed|delivered|transformed)|award.winning|guaranteed|number one|no\.?\s*1)\b/i.test(body)) throw new Error('Unverified project, ranking or guarantee claim.');
  if (/<\/?[a-z]|javascript:|```|\]\(/i.test(body)) throw new Error('Use plain text; HTML and Markdown links are not allowed in article copy.');
  if (!images.some((i) => i.id === post.imageId)) throw new Error('Select an existing image from the image manifest.');
  if (post.sources.length < 2 || post.sources.length > 5) throw new Error('Use 2–5 checked sources.');
  for (const source of post.sources) permittedUrl(source.url, [...config.competitors.map((c) => c.domain), ...config.primarySourceDomains]);
  const cited = new Set(post.sources.map((s) => s.url));
  if (post.sections.some((s) => s.sourceUrls.some((url) => !cited.has(url)))) throw new Error('Section cites an unlisted source.');
  if (post.internalLinks.length < 2 || post.internalLinks.some((l) => !config.internalLinks.some((allowed) => allowed.url === l.url))) throw new Error('Select at least two approved internal links.');
  for (const previous of existing) {
    if (previous.slug === post.slug) throw new Error('Article slug already exists.');
    const a = new Set(normalize(post.title).split(' ')); const b = new Set(normalize(previous.title).split(' '));
    if ([...a].filter((w) => b.has(w)).length / new Set([...a, ...b]).size > 0.68) throw new Error('Article title is too similar to an existing guide.');
    if (previous.sections) {
      const shingles = (value) => { const w = normalize(value).split(' '); return new Set(w.slice(0, -7).map((_, i) => w.slice(i, i + 8).join(' '))); };
      const current = shingles(body); const old = shingles(articleText(previous));
      if ([...current].filter((s) => old.has(s)).length / Math.max(1, current.size) > 0.15) throw new Error('Article repeats too much existing content.');
    }
  }
  return { words };
}

export function checkSourceCopying(post, sources) {
  const words = normalize(articleText(post)).split(' ');
  const sourceTexts = sources.map((source) => normalize(source.pageText));
  for (let i = 0; i <= words.length - 12; i++) {
    const phrase = words.slice(i, i + 12).join(' ');
    if (sourceTexts.some((source) => source.includes(phrase))) throw new Error('Article contains a verbatim passage from a source; rewrite it in original language.');
  }
}
