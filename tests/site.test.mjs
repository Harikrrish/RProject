import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = resolve(import.meta.dirname, '..');
const read = path => readFile(join(root, path), 'utf8');
const exists = path => access(join(root, path));
const pages = ['index.html', 'studio.html', 'blogs.html', ...(await readdir(join(root, 'blog'), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => `blog/${entry.name}/index.html`)];

// Read dimensions from the encoded files, independently of manifest claims.
const dimensionCache = new Map();
function imageDimensions(path) {
  if (!dimensionCache.has(path)) dimensionCache.set(path, (async () => {
    const bytes = await readFile(join(root, path.replace(/^\//, '')));
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      return { width:bytes.readUInt32BE(16), height:bytes.readUInt32BE(20) };
    }
    if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
      for (let offset = 12; offset + 8 <= bytes.length;) {
        const type = bytes.toString('ascii', offset, offset + 4);
        const length = bytes.readUInt32LE(offset + 4), data = offset + 8;
        assert(data + length <= bytes.length, `Truncated WebP: ${path}`);
        if (type === 'VP8X') return { width:bytes.readUIntLE(data + 4, 3) + 1, height:bytes.readUIntLE(data + 7, 3) + 1 };
        if (type === 'VP8 ') return { width:bytes.readUInt16LE(data + 6) & 0x3fff, height:bytes.readUInt16LE(data + 8) & 0x3fff };
        if (type === 'VP8L') {
          const dimensions = bytes.readUInt32LE(data + 1);
          return { width:(dimensions & 0x3fff) + 1, height:((dimensions >>> 14) & 0x3fff) + 1 };
        }
        offset = data + length + (length % 2);
      }
    }
    if (bytes.readUInt16BE(0) === 0xffd8) {
      const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
      for (let offset = 2; offset < bytes.length;) {
        assert.equal(bytes[offset++], 0xff, `Invalid JPEG marker: ${path}`);
        while (bytes[offset] === 0xff) offset++;
        const marker = bytes[offset++];
        if (marker === 0xda || marker === 0xd9) break;
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        const length = bytes.readUInt16BE(offset);
        assert(length >= 2 && offset + length <= bytes.length, `Truncated JPEG: ${path}`);
        if (frameMarkers.has(marker)) return { width:bytes.readUInt16BE(offset + 5), height:bytes.readUInt16BE(offset + 3) };
        offset += length;
      }
    }
    assert.fail(`Unsupported or invalid image: ${path}`);
  })());
  return dimensionCache.get(path);
}
const xmlAttributes = text => Object.fromEntries([...text.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(match => [match[1], match[3]]));

test('Every indexed page has one main heading, unique canonical and valid schema', async () => {
  const canonicals = new Set();
  const redirects = JSON.parse(await read('firebase.json')).hosting.redirects;
  for (const file of pages) {
    const html = await read(file);
    assert.equal([...html.matchAll(/<h1\b/gi)].length, 1, file);
    const descriptions = [...html.matchAll(/<meta\s+name="description"\s+content="([^"]+)"/gi)];
    assert.equal(descriptions.length, 1, `Description: ${file}`);
    const canonical = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/gi)];
    assert.equal(canonical.length, 1, `Canonical: ${file}`);
    const isRetired = file.startsWith('blog/') && redirects.some(rule => rule.source === '/' + file);
    if (!/noindex/.test(html) && !isRetired) {
      assert(!canonicals.has(canonical[0][1]), `Duplicate canonical: ${file}`);
      canonicals.add(canonical[0][1]);
    }
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) assert.doesNotThrow(() => JSON.parse(block[1]), file);
    for (const img of html.matchAll(/<img\b[^>]*>/gi)) assert(/\balt="[^"]*"/.test(img[0]), `Missing alt: ${file}`);
  }
});

test('Local page links, anchors, images and styles resolve', async () => {
  for (const file of pages) {
    const html = await read(file);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/gi)) {
      const value = match[1].replaceAll('&amp;', '&');
      if (/^(https?:|mailto:|tel:|data:)/.test(value)) continue;
      const url = new URL(value, `https://alankaarinteriors.com/${file}`);
      let path = url.pathname.slice(1);
      if (!path || path.endsWith('/')) path += 'index.html';
      await assert.doesNotReject(exists(path), `${file} points to missing ${path}`);
      if (url.hash && path.endsWith('.html')) assert((await read(path)).includes(`id="${url.hash.slice(1)}"`), `${file}: missing anchor ${url.hash} in ${path}`);
    }
  }
});

test('Permanent redirects terminate at a real canonical page without loops', async () => {
  const config = JSON.parse(await read('firebase.json'));
  const sources = new Set();
  for (const rule of config.hosting.redirects) {
    assert.equal(rule.type, 301);
    assert(!sources.has(rule.source), `Duplicate redirect: ${rule.source}`);
    sources.add(rule.source);
    assert(!config.hosting.redirects.some(other => other.source === rule.destination), `Redirect chain: ${rule.source}`);
    const target = rule.destination.endsWith('/') ? rule.destination + 'index.html' : rule.destination;
    await exists(target.slice(1));
  }
  for (const match of (await read('sitemap.xml')).matchAll(/<loc>(.*?)<\/loc>/g)) {
    const pathname = new URL(match[1]).pathname;
    assert(!sources.has(pathname), `Redirect in sitemap: ${pathname}`);
    const target = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
    const html = await read(target.slice(1));
    assert(!/noindex/.test(html), `Noindex page in sitemap: ${pathname}`);
    assert(html.includes(`rel="canonical" href="${match[1]}"`), `Sitemap/canonical mismatch: ${pathname}`);
  }
});

test('Build allowlist excludes credentials and unpublished automation records', async () => {
  const build = await read('scripts/build.mjs');
  assert(!/const entries =[^;]*'(?:content|scripts|tests|docs|\.env|\.github)'/s.test(build));
  // When the build exists, also inspect actual output rather than only configuration.
  try { await exists('public/index.html'); } catch { return; }
  for (const path of ['content', 'scripts', '.env', '.github', 'package.json', 'docs']) {
    await assert.rejects(exists(`public/${path}`), `Private build file exposed: ${path}`);
  }
});

test('The homepage collection represents every original business image and has full-size links', async () => {
  const manifest = JSON.parse(await read('content/gallery.json'));
  const excluded = new Set(['logo', 'optimized', 'gallery', 'journal', 'transformation', 'generated-designs', 'panoramas']);
  const sourceFiles = [];
  for (const entry of await readdir(join(root, 'img'), { withFileTypes:true })) {
    if (excluded.has(entry.name)) continue;
    if (entry.isDirectory()) {
      for (const image of await readdir(join(root, 'img', entry.name))) if (/\.(?:png|jpe?g|webp)$/i.test(image)) sourceFiles.push(`/img/${entry.name}/${image}`);
    } else if (/\.(?:png|jpe?g|webp)$/i.test(entry.name)) sourceFiles.push(`/img/${entry.name}`);
  }
  const included = manifest.items.flatMap(item => item.originalPaths);
  assert.deepEqual(included.sort(), sourceFiles.sort(), 'An original room image is missing or duplicated');
  assert.equal(manifest.sourceFileCount, sourceFiles.length);
  assert.equal(manifest.imageCount, manifest.items.length);
  const homepage = await read('index.html');
  for (const item of manifest.items) {
    await exists(item.thumbnail.slice(1));
    await exists(item.full.slice(1));
    assert(homepage.includes(`data-gallery-id="${item.id}"`), `Missing design ${item.id}`);
    assert(homepage.includes(`href="${item.full}"`), `Missing full image ${item.id}`);
  }
});

test('Every room has fifteen distinct new concepts and a panorama category', async () => {
  const gallery = JSON.parse(await read('content/gallery.json'));
  const panoramas = JSON.parse(await read('content/panoramas.json'));
  const fingerprints = new Set();
  const concepts = gallery.items.filter(item => item.kind === 'generated-concept');
  assert(concepts.length >= 180, 'The 12 categories need at least 180 new concepts in total');
  for (const category of gallery.categories) {
    const items = concepts.filter(item => item.category === category);
    assert(items.length >= 15, `${category} needs at least 15 new, standalone designs`);
    for (const item of items) {
      assert.deepEqual(item.originalPaths, []);
      assert(item.prompt && item.provenance, `Missing provenance: ${item.id}`);
      assert(item.fullWidth >= 1400 && item.thumbnailWidth === 600);
      const hash = createHash('sha256').update(await readFile(join(root, item.full.slice(1)))).digest('hex');
      assert(!fingerprints.has(hash), `Repeated full image: ${item.id}`);
      fingerprints.add(hash);
    }
    const matching = panoramas.filter(item => item.category === category);
    assert.equal(matching.length, 1, `${category} panorama is missing or repeated`);
    const panorama = matching[0];
    assert.equal(panorama.width, panorama.height * 2, 'A spherical panorama needs a 2:1 image');
    await exists(panorama.src.slice(1)); await exists(panorama.preview.slice(1));
    assert((await read('studio.html')).includes(`data-select-room="${panorama.id}"`));
  }
  assert.equal(panoramas.length, 12);
});

test('Every nested panoramic design reaches the studio with its local assets and provenance', async () => {
  const source = JSON.parse(await read('content/panoramas.json'));
  const published = JSON.parse(await read('js/studio-rooms.json'));
  assert.deepEqual(published.map(room => room.id).sort(), source.map(room => room.id).sort());
  const fields = ['id', 'title', 'src', 'preview', 'width', 'height', 'description', 'alt', 'kind', 'yaw', 'pitch'];
  for (const room of source) {
    const designs = room.designs || [room];
    const clientRoom = published.find(item => item.id === room.id);
    assert.equal(clientRoom.category, room.category);
    for (const field of fields) assert.deepEqual(clientRoom[field], room[field], `Changed default ${field}: ${room.id}`);
    assert(designs.length > 0, `Empty room: ${room.id}`);
    assert.equal(new Set(designs.map(design => design.id)).size, designs.length, `Duplicate design IDs in ${room.id}`);
    assert.deepEqual(clientRoom.designs.map(design => design.id), designs.map(design => design.id), `Dropped or reordered designs in ${room.id}`);
    assert(designs.some(design => design.src === room.src && design.preview === room.preview), `Default is not selectable: ${room.id}`);
    for (const design of designs) {
      const clientDesign = clientRoom.designs.find(item => item.id === design.id);
      for (const field of fields) assert.deepEqual(clientDesign[field], design[field], `Changed ${field}: ${design.id}`);
      assert(['generated-panorama', 'existing-visualisation'].includes(design.kind), `Missing provenance kind: ${design.id}`);
      for (const field of ['title', 'description', 'alt']) assert.equal(typeof design[field], 'string', `${design.id}: ${field}`);
      assert(design.title.trim() && design.description.trim() && design.alt.trim(), `Empty accessible description: ${design.id}`);
      for (const field of ['src', 'preview']) {
        assert.match(design[field], /^\/img\/panoramas\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.webp$/, `Nonlocal panorama asset: ${design.id}`);
        await assert.doesNotReject(exists(design[field].slice(1)), `Missing ${field}: ${design.id}`);
      }
      const dimensions = await imageDimensions(design.src);
      assert.deepEqual(dimensions, { width:design.width, height:design.height }, `Incorrect encoded dimensions: ${design.id}`);
      assert.equal(dimensions.width, dimensions.height * 2, `Not a spherical 2:1 image: ${design.id}`);
      const preview = await imageDimensions(design.preview);
      assert.equal(preview.width, preview.height * 2, `Preview aspect ratio: ${design.id}`);
      assert(preview.width <= dimensions.width && preview.height <= dimensions.height, `Upscaled preview: ${design.id}`);
    }
  }
});

test('The completed 4K studio has three generated views per category and retains four originals', async () => {
  const rooms = JSON.parse(await read('content/panoramas.json'));
  const categories = JSON.parse(await read('content/gallery.json')).categories;
  const jobs = (await read('content/panorama-4k-jobs.jsonl')).trim().split(/\r?\n/).map(line => JSON.parse(line));
  const originals = JSON.parse(await read('content/existing-bedroom-panoramas.json'));
  const designs = rooms.flatMap(room => room.designs || [room]);
  const generated = designs.filter(design => design.kind === 'generated-panorama');
  assert.equal(rooms.length, 12);
  assert.deepEqual(rooms.map(room => room.category).sort(), [...categories].sort());
  assert.equal(jobs.length, 36, 'Expected exactly 36 planned native 4K designs');
  assert.equal(new Set(jobs.map(job => job.id)).size, 36, 'Repeated generation job');
  assert.equal(generated.length, 36, 'The final collection needs all 36 generated panoramas');
  assert.equal(designs.length, 40, 'The 36 new panoramas must retain all four original views');
  assert.deepEqual(generated.map(design => design.id).sort(), jobs.map(job => job.id).sort());
  assert.deepEqual(designs.filter(design => design.kind === 'existing-visualisation').map(design => design.id).sort(), originals.map(design => design.id).sort());
  for (const field of ['id', 'src', 'preview']) assert.equal(new Set(designs.map(design => design[field])).size, 40, `Repeated panorama ${field}`);
  for (const room of rooms) {
    const actual = room.designs.filter(design => design.kind === 'generated-panorama');
    const planned = jobs.filter(job => job.category === room.category);
    assert.equal(actual.length, 3, `${room.category} needs exactly three new 4K views`);
    assert.deepEqual(actual.map(design => design.id).sort(), planned.map(job => job.id).sort(), `Wrong category: ${room.id}`);
  }
});

test('Native 4K panoramas are decoded, visually approved and published without source changes', async () => {
  const rooms = JSON.parse(await read('content/panoramas.json'));
  const designs = rooms.flatMap(room => room.designs || [room]).filter(design => design.kind === 'generated-panorama');
  const jobs = new Map((await read('content/panorama-4k-jobs.jsonl')).trim().split(/\r?\n/).map(line => { const job = JSON.parse(line); return [job.id, job]; }));
  const log = JSON.parse(await read('content/panorama-4k-review.json'));
  const approved = log.designs.filter(review => review.status === 'approved');
  assert.equal(log.model, 'gpt-image-2');
  assert.equal(log.requestedSize, '3840x1920');
  assert.deepEqual(approved.map(review => review.id).sort(), designs.map(design => design.id).sort(), 'Every active generated view needs its own approval');
  assert.equal(new Set(approved.map(review => review.id)).size, approved.length, 'Duplicate approval IDs');
  const hasBuild = await exists('public/index.html').then(() => true, () => false);
  const hashes = new Set(), decode = [];
  for (const design of designs) {
    const job = jobs.get(design.id), review = approved.find(item => item.id === design.id);
    assert(job && review, `Missing generation job or approval: ${design.id}`);
    assert.equal(design.sourcePath, `output/imagegen/panoramas-4k/${design.id}.webp`);
    assert.equal(design.src, `/img/panoramas/4k/${design.id}.webp`);
    assert.equal(design.preview, `/img/panoramas/4k/${design.id}-preview.webp`);
    assert.equal(design.model, 'gpt-image-2');
    assert.equal(design.prompt, job.prompt, `Changed generation prompt: ${design.id}`);
    assert.deepEqual({ width:design.width, height:design.height }, { width:3840, height:1920 });
    const source = await readFile(join(root, design.sourcePath));
    const hash = createHash('sha256').update(source).digest('hex');
    assert.equal(design.sourceSha256, hash, `Source fingerprint changed: ${design.id}`);
    assert.equal(review.sha256, hash, `Published source differs from approved image: ${design.id}`);
    assert.equal(review.source, design.sourcePath);
    assert.deepEqual({ width:review.width, height:review.height }, { width:3840, height:1920 });
    assert.equal(typeof review.review, 'string');
    assert(review.review.trim(), `Missing visual review: ${design.id}`);
    assert(!hashes.has(hash), `Repeated generated image bytes: ${design.id}`);
    hashes.add(hash);
    const published = await readFile(join(root, design.src.slice(1)));
    assert.equal(Buffer.compare(published, source), 0, `Published panorama was recompressed or replaced: ${design.id}`);
    if (hasBuild) assert.equal(Buffer.compare(await readFile(join(root, 'public', design.src.slice(1))), source), 0, `Built panorama differs from approved source: ${design.id}`);
    decode.push({ path:design.src.slice(1), width:3840, height:1920 }, { path:design.preview.slice(1), width:1200, height:600 });
  }
  // Pillow is also required by the importer. Loading pixels catches corrupt payloads that valid headers alone miss.
  const { stdout } = await promisify(execFile)('python3', ['-c', `
import json, sys
from PIL import Image
assets = json.loads(sys.argv[1])
for asset in assets:
    with Image.open(asset['path']) as image:
        image.load()
        assert image.format == 'WEBP', asset['path']
        assert image.size == (asset['width'], asset['height']), asset['path']
        assert getattr(image, 'n_frames', 1) == 1, asset['path']
        assert image.getexif().get(274, 1) == 1, asset['path']
print(len(assets))
`, JSON.stringify(decode)], { cwd:root, timeout:60000 });
  assert.equal(Number(stdout.trim()), decode.length, 'Not all native images and previews decoded');
});

test('4K labels match actual pixels and all four existing bedroom sources remain available', async () => {
  const rooms = JSON.parse(await read('content/panoramas.json'));
  const originals = JSON.parse(await read('content/existing-bedroom-panoramas.json'));
  assert.equal(originals.length, 4);
  const bedroomDesigns = rooms.find(room => room.category === 'Bedrooms').designs;
  for (const original of originals) {
    const design = bedroomDesigns.find(item => item.id === original.id);
    assert(design, `Existing bedroom omitted: ${original.id}`);
    assert.equal(design.kind, 'existing-visualisation');
    assert.equal(design.src, original.src);
    assert.equal(design.sourcePath, original.sourcePath);
    assert.match(original.sourcePath, /^\/puruvankara\/bedroom_[1-4]\/images\/[a-f0-9]+\.png$/);
    const sourceSize = await imageDimensions(original.sourcePath);
    const displaySize = await imageDimensions(design.src);
    assert.deepEqual(sourceSize, { width:4096, height:2048 }, `Original native resolution: ${original.id}`);
    assert.deepEqual(displaySize, sourceSize, `4K copy must preserve source resolution: ${original.id}`);
  }
  const cards = new Map([...(await read('studio.html')).matchAll(/<a\b[^>]*data-select-room="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(match => [match[1], match[2]]));
  for (const room of rooms) {
    let has4k = false;
    for (const design of room.designs || [room]) {
      const { width, height } = await imageDimensions(design.src);
      const is4k = width >= 3840 && height >= 1920;
      has4k ||= is4k;
      if (/4k/i.test(`${design.title} ${design.description} ${design.src}`)) assert(is4k, `False 4K claim: ${design.id}`);
    }
    assert(cards.has(room.id), `Missing studio card: ${room.id}`);
    assert.equal(/\b4K\b/.test(cards.get(room.id)), has4k, `Incorrect 4K badge: ${room.id}`);
  }
});

test('Legacy tour cube levels only request existing tiles at their actual resolution', async () => {
  let checkedTiles = 0;
  for (const number of [1, 2, 3, 4]) {
    const base = `puruvankara/bedroom_${number}`;
    const metadata = JSON.parse((await read(`${base}/meta.json`)).replace(/^\uFEFF/, ''));
    assert.equal(metadata.sceneArray.length, 1);
    assert(!/\b16K\b/i.test(metadata.sceneArray[0].resolution), `Unsupported 16K claim: ${base}`);
    const xml = await read(`${base}/gen.xml`);
    assert(!xml.includes('x-oss-process'), `Static tour depends on remote image transforms: ${base}`);
    const images = [...xml.matchAll(/<image\b([^>]*)>([\s\S]*?)<\/image>/g)];
    assert.equal(images.length, 1, `Expected one packaged image configuration: ${base}`);
    const image = xmlAttributes(images[0][1]);
    assert.equal(Number(image.baseindex), 0);
    const levels = [...images[0][2].matchAll(/<level\b([^>]*)>([\s\S]*?)<\/level>/g)];
    assert.deepEqual(levels.map(level => Number(xmlAttributes(level[1]).tiledimagewidth)).sort((a, b) => a - b), [1024, 2048]);
    for (const level of levels) {
      const attributes = xmlAttributes(level[1]);
      const width = Number(attributes.tiledimagewidth), height = Number(attributes.tiledimageheight);
      const tileSize = Number(attributes.tilesize || image.tilesize);
      assert.equal(width, height);
      assert(Number.isInteger(tileSize) && tileSize > 0 && tileSize <= width, `Invalid tile size: ${base}`);
      const cube = level[2].match(/<cube\b([^>]*)\/?\s*>/);
      assert(cube, `Missing cube URL: ${base}`);
      const pattern = xmlAttributes(cube[1]).url;
      assert.match(pattern, /^tiles\/[a-f0-9]+\/cubemap\/l[12]\/%s_h%h_v%v\.jpg$/);
      for (const face of ['l', 'f', 'r', 'b', 'u', 'd']) {
        for (let vertical = 0; vertical < Math.ceil(height / tileSize); vertical++) {
          for (let horizontal = 0; horizontal < Math.ceil(width / tileSize); horizontal++) {
            const path = `${base}/${pattern.replace('%s', face).replace('%h', horizontal).replace('%v', vertical)}`;
            assert.deepEqual(await imageDimensions(path), {
              width:Math.min(tileSize, width - horizontal * tileSize),
              height:Math.min(tileSize, height - vertical * tileSize)
            }, `Tile dimensions disagree with configuration: ${path}`);
            checkedTiles++;
          }
        }
      }
    }
    for (const depthmap of images[0][2].matchAll(/<depthmap\b([^>]*)\/?\s*>/g)) {
      for (const [key, value] of Object.entries(xmlAttributes(depthmap[1]))) if (/url$/.test(key)) await exists(`${base}/${value}`);
    }
  }
  assert.equal(checkedTiles, 120);
});
