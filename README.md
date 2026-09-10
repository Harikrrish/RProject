# Alankaar Interiors

Static website for the Chennai interior design studio, hosted on Firebase.

## Run locally

Requires Node 22 or newer. The preview and build use Node's standard library. The panorama importer and image-decoding regression checks also require Python 3 with Pillow.

```sh
npm run dev
# Open http://127.0.0.1:4173
npm test
npm run build
npm run preview
```

Stop the development server before running the production preview on the same port. Set `PORT` to use another port. The local server respects the exact Firebase redirects and serves only public site files.

`npm run build` renders blog records, merges the image collection and renders the virtual studio, then copies the public website to `public/`. It preserves all four existing virtual tours. Design-specific model profiles in `content/layouts/*.json` produce the public `js/studio-layouts.json`, with private profile notes excluded. Source records, research notes, automation scripts, tests and secrets are excluded. The output folder is generated and ignored by Git.

## Deploy

```sh
npm ci
npm run build
npm test
npx firebase deploy --only hosting
```

The existing Firebase project alias is `alankaar-interiors`. Deployment needs an account with access to that project. The site is published at https://alankaarinteriors.com. The blog workflow prepares draft pull requests; it does not deploy Firebase.

## What changed

- Orange `#FF9800` retained, with new shared layouts and locally hosted Manrope typography throughout, rounded buttons, softer cards and responsive image galleries.
- All 120 original room images are represented by 119 distinct designs, alongside 180 new generated concepts: 15 for each of 12 categories, giving 299 designs in total. The homepage shows 24 initially; choosing a room shows that entire category. Full images open in an accessible dialog. Original files and generated-image provenance are preserved in the source records. The homepage uses a collection-wide disclosure, with clean titles on cards and room names in the image viewer.
- Five original customer testimonials restored verbatim, with names and roles from the supplied site; no star ratings or third-party verification added. Source recorded in `content/testimonials.json`.
- All seven core journal guides have distinct covers and contextual reference images. Three new premium editorial illustrations are documented in [journal image prompts](docs/journal-image-prompts.md).
- Five matching room visualisations show shell, first fix, joinery, finishing and completed home. The first three include five workers, with three in the finishing stage. Controls support keyboard activation and reduced motion.
- A prominent walkthrough feature above the gallery and stronger studio navigation lead to all 40 native 4K designs. Every design has four guided panorama highlights, four walking viewpoints in a matching 3D model and an orbitable layout. Forty individual models replace the 12 generic category models. The design picker remains visible and keeps the selected design across all three modes. The walkthrough library highlights every design, while retaining the four original bedroom tours.
- The existing panorama collection has three generated images at 3840 × 1920 in each of 12 categories, plus four original bedroom visualisations at 4096 × 2048. Bedrooms has seven designs; every other category has three. This walkthrough update generates no new images. A panorama remains one fixed-viewpoint image; actual viewpoint movement happens inside its matching 3D model. Models are manually interpreted from visible furniture, finishes and arrangement, with estimated proportions rather than measured CAD or photogrammetric reconstruction. See [virtual studio notes](docs/virtual-studio.md), [exact image generation jobs](content/panorama-4k-jobs.jsonl) and [source approval records](content/panorama-4k-review.json).
- Seven original planning guides replace repetitive copy. Twelve thin location pages redirect permanently to relevant guides.
- Static, crawlable content, consistent metadata, structured data, sitemap, responsive images and a custom 404 page.
- Contact requests retain the original Railway endpoint. Success appears only after an accepted HTTP response; failures preserve entered details and show a phone alternative. The live service accepted a read-only CORS preflight for POST requests; no enquiry was sent during testing, so email delivery has not been verified. The backend is external to this repository.
- Existing Google Ads tag `AW-16767062044` retained on the production hostname only.

## Blog scheduler

Monday, Wednesday and Friday at 09:00 India time; at most one article per day and three per week. It researches competitors and primary sources, checks freshness, factual support, duplication and image provenance, and opens one draft PR for review. A pending draft pauses new generation.

Follow [the activation guide](docs/blog-automation.md) to add `OPENAI_API_KEY`, set `BLOG_AUTOMATION_ENABLED=true` and enable GitHub Actions pull-request permissions. No key is stored in the frontend. `npm run blog:dry-run` checks configuration without spending API credits.

## Validation and assets

`npm test` covers scheduler failure paths, source/date checks, content rendering, page metadata, local links, redirects and build privacy. Panorama assertions require 36 distinct generated designs, all four originals, matching approval and source hashes, unchanged published image bytes, decoded native dimensions and valid legacy tiles. `npm run test:browser` uses native Chrome DevTools Protocol against a running isolated Chrome on port 9333 and the local site on port 4173. The existing suites cover responsive layouts, five scroll states, reduced motion, navigation, filters, article pages, mocked contact requests, panoramas, selectors, keyboard controls and WebGL fallback. Override `CDP_URL` or `SITE_URL` if needed. Browser screenshots are written to `/tmp/alankaar-review/`.

The matching-model update passed all 33 unit/source/model tests and both browser suites against the local production build after the geometry corrections. The studio suite rendered all 40 designs in panorama, layout and walking modes (120 views), checked all four walking stations per design, distinct designs within each category, guided highlights, autoplay and manual pause, reduced motion, deep links, 320–1440px layouts, native 4K image dimensions, resource disposal and missing-model/WebGL fallbacks. All 40 models were also visually accepted in layout and walking views after corrections. Image generation and source approval records remain separate from these integration checks.

See [SEO notes](docs/seo-changes.md), [image prompts and provenance](docs/hero-image-prompts.md) and the font licences in `fonts/`. To use real construction progress, replace all five matching scene images with authorised photos of the same project and update the caption and alt text accordingly. The complete collection describes the designs visually; it does not invent client names, project locations or completed-work claims.

`content/gallery.json` tracks every original image and its optimized variants. Run `python3 scripts/gallery-build.py` (Pillow required) to rebuild those assets after adding original images, then `npm run build` to regenerate the static homepage. The regular build uses existing optimized assets and does not require Python.

The new standalone image prompts and provenance are in [collection A](docs/generated-designs-a.md), [collection B](docs/generated-designs-b.md) and [collection C](docs/generated-designs-c.md). Panoramas are documented separately in [panorama prompts](docs/panorama-prompts.md). The generated concepts are fictional design inspiration, not completed client work.
