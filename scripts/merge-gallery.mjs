import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Keep every supplied image. Generated concepts are separate source records so
// rebuilding the original thumbnails can never remove the new collection.
export async function mergeGallery({ root = process.cwd() } = {}) {
  const path = join(root, 'content/gallery.json');
  const gallery = JSON.parse(await readFile(path, 'utf8'));
  const originals = gallery.items.filter(item => item.originalPaths?.length);
  const concepts = [];
  for (const name of ['generated-gallery-a.json', 'generated-gallery-b.json', 'generated-gallery-c.json']) {
    try {
      const data = JSON.parse(await readFile(join(root, 'content', name), 'utf8'));
      concepts.push(...(Array.isArray(data) ? data : data.items));
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const item of concepts) if (!gallery.categories.includes(item.category)) throw new Error(`Unknown gallery category: ${item.category}`);
  const groups = gallery.categories.map(category => {
    const old = originals.filter(item => item.category === category);
    const fresh = concepts.filter(item => item.category === category);
    const items = [];
    for (let i = 0; i < Math.max(old.length, fresh.length); i++) {
      if (fresh[i]) items.push(fresh[i]);
      if (old[i]) items.push(old[i]);
    }
    return items;
  });
  gallery.items = [];
  for (let i = 0; i < Math.max(...groups.map(group => group.length)); i++) {
    for (const group of groups) if (group[i]) gallery.items.push(group[i]);
  }
  gallery.imageCount = gallery.items.length;
  gallery.generatedCount = concepts.length;
  gallery.categoryCounts = Object.fromEntries(gallery.categories.map(category => [category, gallery.items.filter(item => item.category === category).length]));
  gallery.provenance = 'Complete supplied collection, plus individually generated design concepts with provenance retained in the image records. Generated images do not document completed client projects.';
  await writeFile(path, JSON.stringify(gallery, null, 2) + '\n');
  return gallery;
}
