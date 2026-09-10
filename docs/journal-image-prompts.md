# Journal image directions and provenance

The seven core guides use distinct covers and a second image placed inside the section it helps explain. All images are visual references, not evidence of completed Alankaar client projects. Three new editorial illustrations were generated with the built-in image generation tool; no API or CLI image-generation fallback was used.

New illustrations are stored as 1440 × 960 WebP images under `img/journal/`, with 720 × 480 `-small.webp` alternatives for cards and smaller screens. Existing square references have also been encoded as WebP with 720-pixel alternatives. Original gallery files remain unchanged.

## Article placement

| Guide | Cover | Reference image beside the relevant section |
| --- | --- | --- |
| `budget-interior-design-chennai` | `/img/journal/materials-and-plan.webp` | `/img/journal/kitchen-simple-layout.webp` in `choose-where-to-spend` |
| `modern-kitchen-design-chennai` | `/img/journal/kitchen-storage-detail.webp` | `/img/journal/kitchen-circulation.webp` in `plan-your-daily-route` |
| `small-house-interior-design-chennai` | `/img/journal/compact-apartment.webp` | `/img/journal/living-closed-storage.webp` in `give-each-item-a-home` |
| `bedroom-interior-design-ideas-chennai` | `/img/journal/bedroom-layered-light.webp` | `/img/journal/bedroom-bed-position.webp` in `place-the-bed` |
| `best-interiors-in-chennai` | `/img/journal/living-room-planning.webp` | `/img/journal/materials-and-plan.webp` in `write-a-useful-brief` |
| `interior-designer-in-chennai` | `/img/journal/workspace-design-reference.webp` | `/img/journal/materials-and-plan.webp` in `ask-for-material-details` |
| `interior-works-in-chennai` | `/img/transformation/premium-installation.webp` | `/img/transformation/premium-complete.webp` in `final-check-and-handover` |

The installation guide reuses the matching installation and completed-room illustrations from the landing-page sequence. Those images and their source prompts are documented in [hero-image-prompts.md](hero-image-prompts.md).

Generated imagery is labelled as an AI-generated illustration in the visible caption. The sample floor plan is explicitly illustrative, not a measured project drawing. Gallery images are labelled as existing design references without claiming that they depict the studio or a particular customer's property. Descriptive alt text explains the relevant visible content; decorative card copies use empty alt text because the adjacent article link already names the destination.

## New illustrations: exact prompts

### materials-and-plan

Output: `img/journal/materials-and-plan.webp` and `img/journal/materials-and-plan-small.webp`.

Use case: photorealistic-natural. Asset type: premium interior-design journal cover, horizontal 3:2 composition. Create a refined editorial still life of an interior designer's project planning table: two elegantly arranged walnut and light oak veneer samples, a warm ivory stone sample, a small brushed brass handle, a folded oatmeal linen swatch, and a neat unbranded pencil resting alongside an architectural floor plan showing a believable small apartment layout. The floor plan has fine black drawing lines and furniture outlines but absolutely no letters, words, dimension numerals or logos. Matte pale warm-grey worktable, carefully composed tactile materials, precise softly shadowed edges, warm daylight from an unseen window, beautiful restrained architectural magazine photography, natural honest textures, high detail. The materials and floor plan are the main subject, visually clear at blog-card scale; horizontal landscape image, near overhead camera at a slight oblique angle with calm breathing room. No people, no typography, no watermark, no brand labels, no piles of clutter. This is a fictional editorial design illustration, not a real client project.

### kitchen-storage-detail

Output: `img/journal/kitchen-storage-detail.webp` and `img/journal/kitchen-storage-detail-small.webp`.

Use case: photorealistic-natural. Asset type: horizontal 3:2 interior-design journal editorial illustration. Show a beautifully proportioned premium contemporary Indian apartment kitchen, framing the cabinetry from waist height at a three-quarter angle. Main subject: one wide open oak-lined deep pan drawer beneath a warm white stone worktop, neatly holding a small realistic assortment of stainless-steel saucepans, one pressure cooker and nested lids, and an adjacent shallow drawer open just enough to show an orderly utensil insert. Closed surrounding cabinets in warm matte taupe, brushed metal handles, understated walnut accent, soft under-cabinet task lighting; simple sink and clear preparation area in background. Mechanical drawer geometry must be credible and straight: two separate cabinet bays, drawers on rails, no overlapping doors, no floating objects, no impossible hinges. Restrained stylish editorial architectural photography, tactile materials, warm natural side daylight, premium but practical lived-in kitchen. Clear subject, clean composition, 50mm-equivalent lens, landscape. No people, no lettering, no logos, no watermark, no oversized villa or unnecessary decoration. A fictional design illustration.

### compact-apartment

Output: `img/journal/compact-apartment.webp` and `img/journal/compact-apartment-small.webp`.

Use case: photorealistic-natural. Asset type: premium interior-design blog cover, horizontal 3:2. Create a convincing compact contemporary Chennai apartment living and dining room designed beautifully for everyday use, about 4 by 5 metres. Camera at normal eye height from a doorway looking toward a wide bright balcony window. A modest two-seat sofa in oatmeal linen, a small rounded timber coffee table, a narrow fitted oak media/storage wall with mostly closed cabinetry on the opposite wall, a genuinely small four-seat dining table behind the sofa edge, subtle warm-white walls, warm light stone floor and one leafy plant. Show a clear uncluttered walking route from doorway toward balcony and between living and dining; proportions must read as a compact comfortable apartment, never an enormous luxury villa. Light curtains, warm natural daylight, restrained contemporary premium styling with authentic wood grain and soft textiles. Realistic architectural editorial photography aesthetic, tasteful composition, crisp straight architecture, 35mm-equivalent lens without fisheye, no people, no text, no logos, no watermark. Fictional design visualisation, not a claimed actual client property.

## Existing-gallery selections

- `img/bed-room/3.png` → `img/journal/bedroom-layered-light.webp` and `img/journal/bedroom-layered-light-small.webp`.
- `img/bed-room/4.png` → `img/journal/bedroom-bed-position.webp` and `img/journal/bedroom-bed-position-small.webp`.
- `img/modular-kitchen/5.png` → `img/journal/kitchen-simple-layout.webp` and `img/journal/kitchen-simple-layout-small.webp`.
- `img/modular-kitchen/3.png` → `img/journal/kitchen-circulation.webp` and `img/journal/kitchen-circulation-small.webp`.
- `img/living-room/7.png` → `img/journal/living-closed-storage.webp` and `img/journal/living-closed-storage-small.webp`.
- `img/living-room/2.png` → `img/journal/living-room-planning.webp` and `img/journal/living-room-planning-small.webp`.
- `img/office/2.png` → `img/journal/workspace-design-reference.webp` and `img/journal/workspace-design-reference-small.webp`.

Only format conversion and resizing were applied to these references. Their visible subjects were inspected before selection. Blog article copy, canonical URLs, external citations, publishing gates and generated-card markers are preserved.
