# Native 4K panorama generation and provenance

The collection contains 36 new panoramas generated natively at 3840 × 1920 with `gpt-image-2` through the bundled image CLI/API: three distinct designs in each of the 12 gallery categories.

Together with the four preserved original bedroom panoramas at native 4096 × 2048, the studio has 40 active 4K designs. Bedrooms has seven selectable views; each other category has three. The previous 1774 × 887 generated concepts are replaced in the active manifest. Their historical source paths and exact prompts remain in the [replaced-image archive](panorama-prompts.md#archive-replaced-built-in-panoramas).

The job records and complete exact prompts are in [panorama-4k-jobs.jsonl](../content/panorama-4k-jobs.jsonl). Each line contains `id`, `category`, `title`, `description`, `alt`, `prompt`, `size`, `quality`, `output_format`, `output_compression` and the stable output filename `out`; selected designs also specify an opening `yaw` and `pitch`. The [review log](../content/panorama-4k-review.json) records inspected source paths, SHA-256 hashes, native dimensions and approval decisions. Titles and descriptions support design selection; every generated image retains the **AI-generated design concept** label without presenting it as completed client work.

| Category | Design 1 | Design 2 | Design 3 |
| --- | --- | --- | --- |
| Living rooms | Walnut, limestone and linen | A soft stone city lounge | Teak and quiet heritage colour |
| Shops | A considered clothing boutique | A quiet jewellery showroom | A neighbourhood coffee studio |
| Bathrooms | A limestone bathing room | Sage tile, compact planning | Graphite and pale terrazzo |
| Kitchens | Pale oak and warm white | Terracotta and a green courtyard | Walnut galley, clean lines |
| Bedrooms | Oak and linen calm | Mocha, bronze and soft light | Indigo and crafted teak |
| Wardrobes | Walnut dressing gallery | A bright two-wall wardrobe | Graphite and smoked glass |
| Dining | Teak around an oval table | A warm banquette dining room | Stone table, sculptural oak |
| Pooja | Teak screen and warm stone | White stone and soft brass | Graphite niche, crafted detail |
| Kids | A room to sleep and study | A shared room in soft blue | A bright creative playroom |
| Workspaces | A quiet walnut office | An open design studio | A home library for work |
| Balconies | A sheltered reading balcony | Breakfast beside the garden | A terrace under timber shade |
| Renovation | An apartment living room renewed | A kitchen with a clearer layout | A bedroom with storage resolved |

## Projection and image specification

Each prompt requests native 3840 × 1920 pixels, full 360° × 180° equirectangular projection, a single level viewpoint 1.5 metres above the floor, and a clear practical centre for the camera. The horizon is at y=960; complete ceiling/sky and floor cover the poles. The same rear wall continues across the left/right wrap seam, with coherent floor joints, ceiling geometry, materials and lighting. Fixtures and furniture stay away from that seam and are not duplicated to fill it. Balcony prompts account for their building wall, roof or pergola, railing and continuous outdoor outlook. Bathroom prompts constrain mirror reflections and the number of fixtures.

The generation settings are `size: "3840x1920"`, `quality: "high"`, `output_format: "webp"` and `output_compression: 95`. The bundled image CLI submits the jobs to `gpt-image-2` and saves separate API outputs under `output/imagegen/panoramas-4k/<id>.webp`. All 36 native outputs have been produced. Sharp material detail, usable shadow detail and consistent depth of field are specified in every prompt. Minor synthetic geometry or projection inconsistencies remain possible and are documented in individual reviews.

## Source handling and integration status

The importer copies approved full WebPs unchanged into `img/panoramas/4k/`, creates 1200 × 600 previews at WebP quality 85, and records each exact prompt, model, output path and source SHA-256 in private content records. It does not upscale, sharpen, reproject or recompress the full panorama. Source approvals follow inspection of the raw panorama and six spherical viewer directions; the review log identifies the inspected bytes.

The API path supplies native source detail that was absent from the earlier built-in outputs. The bundled CLI is unmodified. Its isolated temporary dependencies include OpenAI Python 3.11.0, Pillow 12.3.0 and Brotli 1.2.0 under `/tmp/alankaar-imagegen-deps`; that Brotli version supports HTTPX2's response decoder. API credentials, raw outputs, job prompts and review records remain outside the public build.

Historical validation for the earlier 4K panorama import: that production build passed 28 unit/source tests, including decoded native dimensions, unique source hashes and byte-for-byte raw-to-published image checks. Both browser suites passed on local port 4174. At that stage, the studio suite rendered all 40 panoramas and the former 12 category layouts, and checked actual 4K textures, high-density buffers, selectors and deep links, one canvas after switching, keyboard controls, 320–1440px layouts, lazy homepage loading and WebGL fallback. These results predate the matching-model and walking-mode update. See the [current virtual studio notes](virtual-studio.md) for its 40 individual models and validation status. Source generation and individual image approvals remain separate from model and browser integration checks.

## Importing approved outputs

After visually checking a returned image, run `python3 scripts/import-panorama-4k.py --ids living-rooms-4k-01` (or a comma-separated list of inspected IDs). The importer reads the unchanged API output under `output/imagegen/panoramas-4k/`, rejects files that are not decoded 3840 × 1920 WebPs, copies original image bytes into `img/panoramas/4k/`, and creates only a downscaled 1200 × 600 preview. It records a source hash and prompt, keeps the four original bedroom visualisations, and replaces lower-resolution generated designs within the approved categories. Run `npm run build` after importing. Only inspected, approved source images are imported.

## Acceptance before integration

1. Verify actual decoded dimensions are exactly 3840 × 1920 and retain source output provenance demonstrating native generation. File dimensions alone do not prove an image was not upscaled.
2. Inspect inside the spherical viewer: the complete room must surround the fixed viewpoint without behaving like a stretched flat photograph.
3. Rotate through the ±180° seam and check continuous wall finish, floor joints, ceiling lines, lighting and object counts.
4. Look directly up and down. Reject black gaps, false holes, abrupt texture patches and pinched furniture at the poles.
5. Confirm a level horizon, clear camera position, plausible doors/windows and usable circulation through a full rotation.
6. Check bathroom mirrors and retail glass for invented rooms, repeated fixtures, duplicate entrances or checkout counters. Check balcony railings, canopy and outdoor horizon for connected geometry.
7. Inspect material detail at the viewer's intended field of view. Reject smeared grain, blur, halos, readable text, people, watermark or cloned furniture clusters.
8. Preserve all four original bedroom views and keep each existing generated view active until its replacement passes review. Record actual dimensions, source provenance, selected asset paths and approval hashes in the private manifests and review log.
