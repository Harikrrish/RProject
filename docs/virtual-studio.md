# Virtual studio and expanded design collection

The orange brand accent and local Manrope fonts are retained. The phone link is visible in the shared header at every supported width.

## Five-stage homepage

The sticky sequence moves through shell, first fix, joinery, finishing and completed home. Four newly generated edits retain the finished room's camera and architecture. The first three contain five workers; finishing contains three. The final completed room is unchanged. Numbered buttons and keyboard activation work independently of scrolling, and reduced-motion mode initially shows the finished room.

Assets and exact generation prompts are recorded in [hero-image-prompts.md](hero-image-prompts.md).

## Three ways to explore every design

The homepage introduces the walkthroughs **before** the gallery, with a large preview, a direct studio link and links to every category. Navigation and the active gallery filter also lead to the studio. Inside the studio, the walkthrough library highlights every design instead of limiting discovery to the original four bedroom tours.

`studio.html` offers 40 native 4K panoramic designs across 12 categories: living rooms, kitchens, bedrooms, wardrobes, dining, pooja, kids, workspaces, shops, bathrooms, balconies and renovation. Every design now has its own matching 3D model, replacing the 12 generic category layouts with 40 individual models. Each category contains three generated panoramas; bedrooms also retains the four original 4096 × 2048 colour panoramas, giving it seven designs. The four original bedroom tours remain available separately.

- **360° panorama:** the existing collection of 36 concepts generated natively at 3840 × 1920 with `gpt-image-2`, plus four original bedroom visualisations at 4096 × 2048. Each design has four guided highlights that turn the view toward visible furniture, finishes or room features. Drag, pinch, use arrow keys or use the view controls to look around. The panorama remains a single image captured or generated from one fixed viewpoint; selecting a highlight changes the viewing direction, not the camera's position.
- **Walkthrough:** four viewpoints in each matching 3D model, starting at the room centre and continuing to three clear floor positions. Moving between these viewpoints changes the camera position inside the model. These views are locally rendered geometry, not additional photorealistic captures of the panorama.
- **3D layout:** orbit and zoom around the same matching model to inspect its furniture and arrangement from outside. The selected design is retained when switching between panorama, walkthrough and layout, and the design picker stays visible in all three modes.

The 40 models are manually interpreted from the panoramas' visible furniture, finishes, openings and arrangement. Room proportions and positions are estimates. The models are neither measured CAD nor photogrammetric reconstructions, and they should not be used as as-built plans. Distinct rooms retain their identities: a playroom is modelled as a playroom, a shared office as a shared office, and renovation designs have their corresponding living room, kitchen or bedroom. Small decor, reflections and complex construction details are simplified. Generated panoramas can also contain minor synthesis and projection inconsistencies.

This update reuses the existing 40 native 4K images; it generates no new panorama images. Source model profiles are in `content/layouts/*.json`, including estimated envelopes, furniture, openings, four panorama highlights and four model viewpoints per design. The build creates `js/studio-layouts.json` for the browser and excludes the private `notes` fields.

The four original 4K assets and corrected legacy cube-tile configuration are documented in [legacy-tour-resolution.md](legacy-tour-resolution.md). The new collection's native generation settings and import process are in [the 4K generation record](panorama-4k-plan.md), with [exact job prompts](../content/panorama-4k-jobs.jsonl) and [visual approvals tied to source hashes](../content/panorama-4k-review.json). Full generated WebPs are copied without recompression from the API outputs into `img/panoramas/4k/`; their 1200 × 600 previews are downscaled copies. The original bedroom source images and viewing poses are preserved.

Current provenance and the retained archive of replaced built-in image prompts are in [panorama-prompts.md](panorama-prompts.md). The active source manifest is `content/panoramas.json`. The build exposes only presentation fields in `js/studio-rooms.json`; generation prompts, approval records and source hashes remain outside the public build.

The homepage defers WebGL and panorama requests until the visitor starts the viewer. Rendering is driven by interaction and resize rather than a continuous idle animation. Changing the design or mode disposes of old geometry, materials, textures, controls and shadow maps, and reuses a single canvas. Panorama rendering follows device pixel density up to 3× with an 8.3-megapixel drawing-buffer budget. The default vertical field of view is 78°, with close zoom limited to 60° to avoid excessive enlargement of source pixels. These rendering changes cannot restore detail absent from the source image. Devices without WebGL retain the preview image, retry control and browsable design links. Fullscreen uses the browser's native capability where available.

Three.js 0.186.0 and its two addons are vendored under `js/vendor/`, minified and distributed with the MIT licence. No runtime CDN or API key is required. See `js/vendor/README.txt` for exact upstream and transformation details.

## Gallery sources

All 120 supplied image files remain represented by 119 distinct gallery entries (one original exact duplicate is merged). New generated concepts use separate manifests and their own directory, `img/generated-designs/`. Every concept has a standalone full image, a 600px thumbnail, an accurate description, its exact generation prompt and an explicit generated-concept label in the UI.

The build merges source manifests, interleaves old and new designs by room, recomputes category counts and renders crawlable links. The general collection opens with 24 cards and a load-more button; selecting a category shows that category's full collection. The lightbox supports previous/next navigation and restores focus on close.

Run `npm run build` after changing a gallery manifest, panorama manifest or model profile. Run `npm test` for source completeness, distinct asset fingerprints, the minimum image count, metadata and local links. With isolated Chrome running on port 9333, run `npm run test:browser` against the local site for browser integration checks. Contact requests are mocked; browser checks do not send customer enquiries.

The matching-model update passed all 33 unit/source/model tests and both browser suites against the local production build after the geometry corrections. Browser verification rendered all 40 designs in panorama, layout and walking modes (120 views), checked all four walking stations per design, distinct designs within each category, guided highlights, autoplay and manual pause, reduced motion, deep links, 320–1440px layouts, native 4K image dimensions, resource disposal and missing-model/WebGL fallbacks. All 40 models were also visually accepted in layout and walking views after corrections. Individual panorama source approvals remain recorded separately in the review log.

This work changes source files and the local production build. Deployment and activation of the blog scheduler are separate from the virtual studio.
