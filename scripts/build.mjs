import { cp, mkdir, readdir, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderBlogs } from './blog-render.mjs';
import { renderGallery } from './render-gallery.mjs';
import { mergeGallery } from './merge-gallery.mjs';
import { renderStudio } from './render-studio.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'public');
const entries = ['index.html', 'studio.html', 'blogs.html', '404.html', 'robots.txt', 'sitemap.xml', 'blog', 'css', 'js', 'img', 'fonts', 'puruvankara'];
// Render source records before copying. Credentials, research and automation code
// are deliberately absent from this explicit list of public assets.
await renderBlogs({ root });
await mergeGallery({ root });
await renderStudio({ root });
await renderGallery({ root });
for (const entry of entries) await access(join(root, entry));
await mkdir(output, { recursive: true });
for (const entry of await readdir(output)) await rm(join(output, entry), { recursive: true, force: true });
for (const entry of entries) {
  await cp(join(root, entry), join(output, entry), {
    recursive: true,
    filter: source => !source.split('/').some(part => part.startsWith('.')) && !/\.(ttf|exr)$/i.test(source)
  });
}
console.log('Built Firebase site in public/. Automation, source records and secrets are excluded.');
