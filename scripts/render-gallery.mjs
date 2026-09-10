import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export const categoryKey = category => ({'Living rooms':'living','Kitchens':'kitchen','Bedrooms':'bedroom','Wardrobes':'wardrobe','Balconies':'balcony'}[category] || category.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
export async function renderGallery({ root = process.cwd() } = {}) {
  const gallery = JSON.parse(await readFile(join(root, 'content/gallery.json'), 'utf8'));
  const indexPath = join(root, 'index.html');
  let html = await readFile(indexPath, 'utf8');
  const start = '<!-- HOME_GALLERY_START -->', end = '<!-- HOME_GALLERY_END -->';
  if (!html.includes(start) || !html.includes(end)) throw new Error('Homepage gallery markers are missing.');
  if (!Array.isArray(gallery.items) || !gallery.items.length) throw new Error('Gallery needs images.');
  const ids = new Set();
  for (const item of gallery.items) {
    if (ids.has(item.id)) throw new Error(`Duplicate gallery image ${item.id}`);
    ids.add(item.id);
    for (const path of [item.thumbnail, item.full]) if (!/^\/img\/(?:gallery|generated-designs)\/[a-zA-Z0-9_-]+\.webp$/.test(path)) throw new Error('Gallery paths must point to a local optimized image.');
  }
  const filters = gallery.categories.map(category => `<button type="button" data-filter="${categoryKey(category)}" aria-pressed="false">${escape(category)}<span>${gallery.items.filter(item => item.category === category).length}</span></button>`).join('');
  const cards = gallery.items.map((item, i) => `<a class="design-card" data-gallery-id="${escape(item.id)}" data-kind="${item.kind === 'generated-concept' ? 'generated-concept' : 'collection'}" data-category="${categoryKey(item.category)}" data-label="${escape(item.label)}" data-room="${escape(item.category)}" href="${escape(item.full)}" aria-label="View ${item.kind === 'generated-concept' ? 'AI-generated design concept: ' : ''}${escape(item.alt)}"><div class="design-image"><img src="${escape(item.thumbnail)}" alt="${escape(item.alt)}" width="${item.thumbnailWidth}" height="${item.thumbnailHeight}" loading="lazy" decoding="async"><span class="image-arrow" aria-hidden="true">⤢</span><span class="design-room">${escape(item.category)}</span></div><div class="design-card-caption"><div><h3>${escape(item.label)}</h3>${item.kind === 'generated-concept' ? '<p class="concept-label">AI design concept</p>' : '<p class="collection-label">Alankaar collection</p>'}</div><span>${String(i + 1).padStart(2,'0')}</span></div></a>`).join('\n');
  const section = `<section class="work-section section-space" id="ourdesign"><div class="container">
<div class="section-heading"><div><p class="eyebrow"><span class="orange-dash"></span> The Alankaar collection</p><h2>More spaces.<br><em>More possibilities.</em></h2></div><p>Explore our complete collection of living rooms, kitchens, bedrooms and more. Find the details you would love to bring home.</p></div>
<div class="gallery-toolbar"><p class="collection-size"><strong>${gallery.items.length}</strong> designs to explore <span>· ${gallery.categories.length} kinds of spaces</span></p><a class="text-link" href="#contact">Found something you love? <span aria-hidden="true">↗</span></a></div>
<div class="gallery-filters" role="group" aria-label="Filter the design collection by room"><button type="button" class="active" data-filter="all" aria-pressed="true">All spaces<span>${gallery.items.length}</span></button>${filters}</div>
<div class="gallery-context"><p id="gallery-status" class="gallery-status" role="status" aria-live="polite">${gallery.items.length} designs in the collection</p><a id="gallery-room-view" class="gallery-view-link" href="/studio.html">Explore 360° walkthroughs <span aria-hidden="true">↗</span></a></div>
<div class="design-grid" id="design-grid">${cards}</div>
<div class="gallery-more"><button class="button button-outline" type="button" id="gallery-more" hidden>Explore more designs <span aria-hidden="true">↓</span></button><p id="gallery-count"></p></div>
<p class="gallery-note">Our complete collection sits alongside new AI-generated concepts for inspiration. Talk to us about adapting your favourites to your room, budget and everyday life.</p>
<a class="tour-link" href="/studio.html"><span class="tour-icon" aria-hidden="true">360°</span><span>Step inside a design.<small>Guided 4K tours and matching 3D walkthroughs for every kind of space</small></span><span aria-hidden="true">↗</span></a>
</div></section>
<dialog class="gallery-lightbox" id="gallery-lightbox" aria-labelledby="lightbox-title"><div class="lightbox-header"><p id="lightbox-category"></p><button class="lightbox-close round-button" type="button" aria-label="Close image viewer">×</button></div><div class="lightbox-stage"><button class="lightbox-previous round-button" type="button" aria-label="Previous design">←</button><img id="lightbox-image" src="${escape(gallery.items[0].full)}" alt="" width="${gallery.items[0].fullWidth}" height="${gallery.items[0].fullHeight}" loading="lazy"><button class="lightbox-next round-button" type="button" aria-label="Next design">→</button></div><div class="lightbox-footer"><div><h2 id="lightbox-title">Explore the collection</h2><p id="lightbox-count" aria-live="polite"></p></div><a class="button button-primary" href="#contact" id="lightbox-enquire">Plan a similar space <span aria-hidden="true">↗</span></a></div></dialog>`;
  html = html.slice(0, html.indexOf(start) + start.length) + '\n' + section + '\n' + html.slice(html.indexOf(end));
  await writeFile(indexPath, html);
  return { images: gallery.items.length, originalFiles: gallery.sourceFileCount };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) renderGallery().then(console.log).catch(error => { console.error(error.message); process.exitCode = 1; });
