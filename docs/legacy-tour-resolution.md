# Legacy bedroom tour resolution audit

The four supplied bedroom tours each contain one existing design visualisation, with one panorama scene and no inter-room navigation hotspots. These sources are not documented client photographs. All original image, tile, mesh and vendor JavaScript assets remain untouched.

## Actual source dimensions

Every tour contains a **4096 × 2048 color panorama**, a matching 4096 × 2048 background image, a 4096 × 2048 normal map and a 2048 × 1024 depth map. Cube level `l1` has six 1024 × 1024 faces. Both `l2` and `l3` have six 2048 × 2048 faces. The corresponding packaged tiles are 1024 × 1024: six tiles at `l1`, and 24 each at `l2` and `l3`.

The original XML incorrectly declared `l3` as 4096 × 4096 faces, which implies 16 tiles per face while only four exist. Its scene metadata said `16K`, exceeding the stored source dimensions. The inspected `l3` front face was also vertically inverted relative to `l1`/`l2`; all 24 `l1`/`l2` face pairs were checked and have consistent orientation. Reconstructed `l1`/`l2` tiles match the corresponding supplied faces, with maximum mean channel difference below 0.002 on a 0–255 scale.

## Configuration corrections

Each `gen.xml` now declares only its valid **1024px and 2048px cube levels**, with 1024px tiles and zero-based indices. It uses the packaged local tile paths directly. The former online branch depended on image-server query transformations that a static host does not perform. The depth-map and dollhouse settings are preserved. Removing the invalid `l3` declaration avoids nonexistent tile requests and an incorrect orientation switch; its source files are still present.

The skin’s calculated WebVR plugin URL also resolved one directory too high. Each tour now points that setting to its existing local `bedroom_N/plugins/webvr.js`; the plugin code is unchanged.

Each `meta.json` now describes the actual source as `4096x2048 panorama; 2048x2048 cube faces`. This distinguishes a 4K-wide spherical panorama from 4K cube faces. Per-level dimensions and tile-index placeholders follow the [krpano image reference](https://krpano.com/docu/xml/#image).

## Studio-ready 4K copies

The four inspected original color panoramas were converted to WebP quality 95, method 6 at their native **4096 × 2048** size. Preview copies use WebP quality 85 at **1200 × 600**, with Lanczos downscaling only. There is no upscaling, sharpening, projection conversion, recoloring or generated detail. `content/existing-bedroom-panoramas.json` records their titles, descriptions, source paths and `existing-visualisation` provenance for studio integration.

These four originals remain selectable alongside 36 new native **3840 × 1920** concepts generated with `gpt-image-2` through the bundled image CLI/API. The active studio collection totals **40 native 4K panoramas**, with three generated views per category and seven views in Bedrooms. The former 1774 × 887 generated concepts are replaced in the active collection; the four original source paths and viewing poses are preserved. New generation provenance is separate from this legacy audit: [exact job prompts](../content/panorama-4k-jobs.jsonl) and [source approval log](../content/panorama-4k-review.json).

### bedroom_1 — 95eee52d2bf04c08a40aab19d7d61abf

Source: `/puruvankara/bedroom_1/images/95eee52d2bf04c08a40aab19d7d61abf.png`. SHA-256: `f75b8337f23f0806fab0678e621299bdb40bf437fa0e9710301f801272e2cb17`.

Full: `img/panoramas/bedroom-suite-01-4k.webp` (4096 × 2048, 1,002,494 bytes). Preview: `img/panoramas/bedroom-suite-01-preview.webp` (1200 × 600, 45,570 bytes).

### bedroom_2 — 2ef38477ff42413798f2a37f8d6cbb2a

Source: `/puruvankara/bedroom_2/images/2ef38477ff42413798f2a37f8d6cbb2a.png`. SHA-256: `537ac83799309ca2d037c827eaef4db629747c2bca93bf47594c0e766b9c444b`.

Full: `img/panoramas/bedroom-suite-02-4k.webp` (4096 × 2048, 1,248,764 bytes). Preview: `img/panoramas/bedroom-suite-02-preview.webp` (1200 × 600, 35,262 bytes).

### bedroom_3 — 56bfeced9a824dbba1363fcbef2a3037

Source: `/puruvankara/bedroom_3/images/56bfeced9a824dbba1363fcbef2a3037.png`. SHA-256: `315cb5ee600adebf0a5a888b2e89bdb3b438944e63b9e6030c5d46605b2bf772`.

Full: `img/panoramas/bedroom-suite-03-4k.webp` (4096 × 2048, 1,535,094 bytes). Preview: `img/panoramas/bedroom-suite-03-preview.webp` (1200 × 600, 48,244 bytes).

### bedroom_4 — 4a58731ccc184c1aa6ee3474d08c9486

Source: `/puruvankara/bedroom_4/images/4a58731ccc184c1aa6ee3474d08c9486.png`. SHA-256: `424b5e3639a4e921fc990c142bb79ae8589d6f5a42cccd7841c5359d585691c6`.

Full: `img/panoramas/bedroom-suite-04-4k.webp` (4096 × 2048, 1,119,016 bytes). Preview: `img/panoramas/bedroom-suite-04-preview.webp` (1200 × 600, 27,828 bytes).

## Legacy verification

Parsed all four updated XML and JSON configurations. Expanded every declared cube URL for every face and tile coordinate: **120 of 120 declared tiles exist**, decode correctly and match the declared dimensions. All highest active levels are 2048 × 2048. Source panorama hashes were unchanged after conversion. Checked all eight converted WebPs for actual dimensions and successful decoding. Earlier browser checks against the local production build rendered all four legacy tours, rotated through four horizontal directions plus ceiling and floor, and received HTTP 200 for all 96 requested highest-level tiles. The bedroom 1 recheck after the WebVR URL correction had no failed requests or JavaScript exceptions. Headset VR operation was not tested.

Historical validation for the earlier 4K panorama import: that production build passed 28 unit/source tests, including the legacy tile checks, native image decoding and source hash comparisons. Both browser suites passed on local port 4174. At that stage, the studio suite rendered all 40 panoramas and the former 12 category layouts, and checked native 4K textures, high-density buffers, selectors and deep links, one canvas after switching, keyboard controls, 320–1440px layouts, lazy homepage loading and WebGL fallback. These results predate the 40 matching models and walking mode; see the [current virtual studio notes](virtual-studio.md) for those features and their validation status. The legacy checks above establish the preserved tours' source resolution and tile configuration separately from the expanded studio's verification.
