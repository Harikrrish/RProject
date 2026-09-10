# Homepage room-transformation image provenance

Created on 2026-09-10 using the built-in `image_gen` tool, under the imagegen skill. These are AI-generated illustrative design visualizations, not photographs of completed Alankaar client projects, employees, or a documented construction site. The page must disclose that the sequence is a design visualization.

The completed-room image was generated first. The shell and installation images were separately edited from that same completed-room reference, preserving its fixed camera and room architecture. All three selected results were visually inspected. Minor image synthesis differences can remain; this is an illustrative sequence, not survey imagery.

## Workspace assets

| Stage | Desktop asset | Mobile asset |
| --- | --- | --- |
| Shell | `img/transformation/scene-shell.webp` | `img/transformation/scene-shell-mobile.webp` |
| Installation | `img/transformation/scene-installation.webp` | `img/transformation/scene-installation-mobile.webp` |
| Complete | `img/transformation/scene-complete.webp` | `img/transformation/scene-complete-mobile.webp` |

Native output is 1672 × 941 pixels (approximately 16:9), retained without upscaling. Mobile variants are 900 × 507 pixels, preserving the full composition. Pillow was used only for deterministic resizing and WebP encoding (desktop quality 86, mobile quality 83, encoder method 6); no creative edits, composites, or retouching were performed outside the built-in image-generation tool.

Use CSS to apply a dark text overlay. Recommended accessible description: “Illustrative living-room transformation, from an unfinished shell through fitted interiors to a completed warm wood and stone living room.” Decorative background layers can instead use empty alt text when the adjacent stage copy explains the sequence. Respect reduced-motion preferences.

Original tool outputs remain at `/home/hariharan/.codex/generated_images/01a08804-85ae-7da0-9228-bbe6eae03d88/`. All production assets are saved in the workspace; the website does not depend on those original machine-local paths.

## Exact prompts

### Completed room

Use-case slug: `photorealistic-natural`.

Original output: `exec-91fd7e23-d13c-4172-b50e-9f9bb172e5e9.png`.

No image references supplied.

```text
Use case: photorealistic-natural.
Asset type: wide 16:9 homepage background photograph for an interior design studio's illustrative renovation story.
Primary request: create one beautifully photorealistic premium completed living and dining room in a contemporary Chennai apartment, shot from a fixed tripod near the entry with a 24mm architectural lens at eye level. Show the full room with strong depth, straight verticals, no fisheye.
Scene: a generously sized but believable apartment, three tall black-framed windows and a glass balcony door along the right wall with subtle tropical greenery outside. Far wall has a low warm walnut built-in console, pale travertine central panel, and walnut slatted joinery at one end. On the right half is a low cream fabric sofa and a walnut lounge chair, a small sculptural coffee table on a neutral rug. Beyond, a small elegant dining nook. Fine matte pale stone floor. Layered ceiling with warm recessed lighting, sheer curtains at the right windows. Quiet tactile elegance, warm walnut, off-white linen, stone, subtle brass details; realistic middle-to-upper premium Indian residential interior, not a palace.
Composition: camera in left foreground looking diagonally into the space, keep left third quieter for webpage title overlay, focus of furniture in center-right. Wide landscape 16:9, ideally 2048x1152. Soft natural late-afternoon daylight, warm practical interior lighting, believable photographic texture and restrained contrast. This image will later be edited backward to show construction stages, so architecture must be coherent and simple.
Constraints: no people in this completed version, no text, no logo, no watermark, no montage, no split-screen, no before/after labels, no surreal furniture or impossible geometry. Make a single photograph.
```

### Unfinished shell

Use-case slug: `precise-object-edit`.

Original output: `exec-9d484f13-7d95-474d-96a5-8d2689f81e8b.png`.

Edit target: the completed-room source PNG, viewed before editing; supplied through `referenced_image_paths`.

```text
Use case: precise-object-edit.
Asset type: first stage of a scroll-driven interior renovation visualization, landscape 16:9.
Input image 1 is the edit target and the exact camera/architecture reference.
Primary request: edit this completed living room into its original unfinished shell during active interior work, retaining EXACT same image framing, camera position, focal length, perspective, full room architecture, pillars, back doorway, and the location and size of all tall black-framed right windows and balcony door. Keep exterior greenery and afternoon daylight identical.
Changes: remove every sofa, chair, rug, console, accessory, curtain, fan and finished lighting fixture. Strip the center back accent wall to rough pale cement plaster without its travertine, slats or console. Strip the ceiling to bare concrete, showing a small amount of organized electrical conduit for future recessed lighting. Floor is unfinished gray cement, with limited neatly stacked boards in the foreground center-right and a few sensible tools. Two Indian interior craftspeople doing actual work in the middle and right parts of the room: one safely marking a wall measurement standing on floor, and one preparing timber at a simple workbench. They wear ordinary work shirts and trousers, natural believable anatomy and scale, no posing for the camera. Room is visibly at the beginning of renovation, somewhat dusty but orderly, no chaotic rubble or structural demolition.
Style: high-end photorealistic architectural documentary image, coherent real materials and construction details.
Invariants: preserve all wall/opening positions, camera, framing, outside view, room proportions and right-side window geometry precisely. No text, no logos, no watermark, no montage. Single full-width photograph.
```

### Installation

Use-case slug: `precise-object-edit`.

Original output: `exec-3426ef6d-db0d-4057-b91a-59a5823d9b1c.png`.

Edit target: the completed-room source PNG, viewed before editing; supplied through `referenced_image_paths`.

```text
Use case: precise-object-edit.
Asset type: middle stage of a scroll-driven interior renovation visualization, landscape 16:9.
Input image 1 is the edit target and exact camera/architecture reference.
Primary request: edit this completed living room to show the same room halfway through fitting its interiors. Preserve EXACT image framing, camera position, focal length, perspective, walls, pillars, doorways, tall right-side windows, balcony door, outdoor view and afternoon daylight.
Changes: remove sofa, lounge chair, all loose furniture, rug, artwork, accessories and curtains. Show the back-wall walnut slat panel partly fitted, with the final travertine panel installed and walnut console carcases installed but a few doors still missing, one matching walnut door leaning safely at the wall nearby. Show ceiling's final gypsum shape built but patches still unpainted, recessed warm lighting partially fitted. Completed pale stone floor mostly protected with brown floor protection sheets taped at seams. One Indian carpenter standing in center-right fitting a console cabinet door and a second worker on a low stable step platform safely inspecting the near-right curtain track. Realistic people working, not posing; sensible work clothes, natural anatomy and scale. Small neat toolkit and stacked joinery panels at right foreground. Premium room nearing completion with credible practical installation activity. No finished sofa or decoration.
Style: photorealistic architectural documentary photograph, careful material detail, warm natural daylight.
Invariants: maintain exact architecture, windows, all openings, room proportions, camera and composition. Retain the long travertine accent-wall location and ceiling perimeter design. No text, no logos, no watermark, no montage, one full-width photograph.
```


## Premium residence revision — 2026-09-10

The user requested a more luxurious, more premium finished room while keeping the approved website layout. The earlier `scene-*` assets are retained. This revision was created with the built-in `image_gen` tool; the original completed-room asset was inspected before developing the new creative direction. A new completed room was generated without image references. The shell and installation stages were each edited from that same new completed-room image, seen before editing and supplied via `referenced_image_paths`.

The design uses generous ceiling height, rich walnut paneling, illuminated bespoke shelving, creamy bookmatched stone, bronze details, sculptural upholstered seating, a branch chandelier, a generous textured rug and a lush palm outlook. All selected stages were visually inspected for camera, room and window alignment. Minor material-pattern and construction-detail differences remain possible because these are illustrative transformations.

These images are AI-generated design visualizations. They do not document an Alankaar client project, real construction activity, or actual employees. Keep an accurate design-visualization disclosure when using the sequence or an individual stage in the journal.

| Stage | Desktop asset | Mobile asset |
| --- | --- | --- |
| Shell | `img/transformation/premium-shell.webp` | `img/transformation/premium-shell-mobile.webp` |
| Installation | `img/transformation/premium-installation.webp` | `img/transformation/premium-installation-mobile.webp` |
| Complete | `img/transformation/premium-complete.webp` | `img/transformation/premium-complete-mobile.webp` |

The built-in tool returned **1672 × 941** native images despite an explicit request for 2560 × 1440 or the highest native resolution available. Desktop assets preserve this native resolution without upscaling. Mobile assets are **900 × 507**, preserving the landscape composition. Pillow was used only for deterministic downscaling and WebP encoding: desktop quality 90, mobile quality 86, encoder method 6. All creative generation and edits used the built-in tool.

Original PNG outputs remain in `/home/hariharan/.codex/generated_images/01a08804-85ae-7da0-9228-bbe6eae03d88/`. Production WebP assets are present in the workspace and have no dependency on those machine-local originals.

### Exact premium prompt set

#### Completed premium room

Original output: `exec-a020e919-e974-4a1d-96be-5071ad8caf00.png`.

```text
Use case: photorealistic-natural.
Asset type: architectural magazine quality homepage hero, a single wide landscape interior photograph, 16:9. Create at 2560 x 1440 pixels or the highest native landscape resolution available.
Primary request: an unmistakably luxurious, beautifully detailed completed living room in a high-end contemporary Chennai residence. This needs to feel like the cover photograph of an internationally published architect-designed home: sophisticated custom craftsmanship, generous 11-foot ceilings, exceptional material depth, comfortable elegance.
Architecture and interior: a spacious 8m-wide living room seen from the entry at left, with a tall nearly full-height bank of bronze-framed windows and balcony doors along the right wall revealing dense lush palms. On the far wall, exquisite bookmatched creamy travertine with restrained flowing natural veining is framed by rich dark warm walnut joinery. Bespoke full-height walnut shelving with softly illuminated niches and a few considered ceramic pieces is on the center-left back wall. Seamless bronze trim and softly backlit stone detail, not excessive gold. The left foreground is a quieter rich walnut paneled wall and shadowed entry zone suitable for light webpage typography; keep the architectural hero and furniture visible in center and right.
Furnishings: in center-right a generously proportioned, sculptural curved cream bouclé sofa with plush linen cushions, two rounded warm taupe lounge chairs and a low monolithic travertine coffee table with refined books and one dark vase. A large luxurious textured cream wool rug layered across pale honed limestone floor. A taller sculptural branch chandelier in aged bronze and handblown translucent alabaster-like glass hangs over the main seating group; refined sculptural form, believable construction and scale. Beautiful stepped ceiling planes, soft hidden warm light, tiny recessed fixtures and warm niche lighting create material richness. Tall ivory linen drapery softens the right windows.
Photographic direction: actual architectural photography, not a sterile CGI showroom, tactile material detail, exquisite but real furniture, soft sunlight filtered through palms, warm ambient light, deep atmospheric shadows with excellent detail. 24mm tilt-shift architectural lens on fixed tripod at eye level, straight verticals, natural proportions, strong room depth and an elegant editorial composition. Wide 16:9 full room view, no huge empty floor foreground. A rich visually compelling finished home, inviting and personal.
Constraints: no people in this completed version. No text, labels, logos, watermark, border, montage or split screen. No overdone gold, no palace ornament, no clutter, no visual tricks. Coherent walls, ceiling and windows are essential because this exact room will be edited backwards into earlier renovation stages.
```

#### Premium room shell

Original output: `exec-efd4d923-be27-4927-a89b-4a91a9fa1143.png`.

```text
Use case: precise-object-edit.
Asset type: first stage of a luxury interior renovation sequence, one landscape 16:9 architectural photograph. Highest native quality/resolution.
Input image 1 is the exact edit target and fixed-camera architecture reference.
Primary request: transform this finished living room backwards into its unfinished shell while real interior work is underway. Preserve the EXACT same camera position, lens, image framing, perspective, size and location of walls and ceiling, left entry passage and back-left doorway, and the exact window/door frame positions along the right wall. Preserve the exterior palm trees and soft afternoon daylight.
Change only construction state: remove all sofas, lounge chairs, rugs, coffee tables, decorative objects, plants, chandelier, sconces and curtains. Remove walnut wall panels, shelving and back wall stone panels, leaving believable rough warm grey cement plaster. Left foreground wall must retain its exact architectural shape, now rough plaster in natural shadow. Strip decorative ceiling finish back to a higher unfinished concrete slab with neat electrical conduit in the same basic room volume. Back wall has light pencil layout markings for future cabinetry, but no readable text. Flooring is bare cement.
Work activity: two Indian interior craftspeople, one standing center-back measuring the future joinery with a tape measure and one on the right preparing a timber panel at a sturdy waist-height workbench. Natural believable anatomy, scale and unposed working gestures, work clothes and protective footwear. A neat stack of walnut-toned panels and a compact tool case in right foreground, limited construction dust, organized active worksite. Do not clutter left foreground because homepage copy goes there.
Style: photorealistic architectural documentary image with beautiful natural side light, tactile cement and timber, warm balanced exposure. Single photograph, no simulated graphic filters.
Invariants: DO NOT CHANGE camera/framing/window sizes or placement/exterior/back doorway/wall geometry. No text, logo, watermark, split screen, montage or border.
```

#### Premium room installation

Original output: `exec-31b34b69-6031-4539-b1a7-116a9d987f4a.png`.

```text
Use case: precise-object-edit.
Asset type: middle stage of a luxury interior renovation sequence, one landscape 16:9 architectural photograph. Highest native quality/resolution.
Input image 1 is the exact edit target and fixed-camera architecture reference.
Primary request: edit this finished living room back to the middle of its custom interior installation. Preserve EXACT camera position, lens, framing, perspective, walls and openings, height and geometry of ceiling, left entry and far-left doorway, right window and door frames, exterior palm trees and afternoon light.
Changes: remove the cream sofa, both lounge chairs, rug, coffee/side tables, decorative objects, plants and curtains. Back wall's central bookmatched creamy stone panel is installed exactly in its final position, and the surrounding walnut joinery is halfway fitted: shelving carcass at center-left fitted but some shelves and lower doors absent, visible planned joinery details. Left foreground walnut wall panels partly fitted with one narrow exposed underlay area. Retain the installed stepped ceiling form with discreet unpainted plasterboard finishing patches; indirect cove lighting partially lit. The sculptural chandelier is not installed yet: only its small ceiling mounting plate is visible. Honed stone floor protected with tidy taped brown protection sheets.
Work activity: one Indian carpenter near the back-left shelving fitting a matching walnut shelf, natural working posture and believable anatomy. Another interior craftsperson at a sturdy waist-high workbench on right center preparing a cabinet door. Sensible work clothes and protective footwear, no posing. Small neat stack of walnut panels and closed toolkit at right foreground. Keep left foreground quieter for overlay copy.
Style: photorealistic high-end architectural documentary photography; warm afternoon daylight, authentic refined wood and stone material detail, orderly professional interior fitting in progress.
Invariants: exact geometry, composition, camera, back door opening, all window mullions and palms. Keep central stone vein pattern and wall locations locked to reference. No text, logos, watermarks, borders, montage or split-screen.
```


## Five-stage construction sequence with a larger team

Created on 2026-09-10 using four built-in `image_gen` edits. Each edit used the viewed existing `img/transformation/premium-complete.webp` as its exact camera/architecture reference. The completed-room asset and its mobile version were preserved unchanged as the fifth stage. The new sequence depicts five fictional Indian workers in shell, services and joinery stages, and three fictional workers in the finishing stage. These are generated illustrative professionals, not photographs of Alankaar employees or an actual worksite.

| Stage | Desktop asset | Mobile asset | Visible workers |
| --- | --- | --- | --- |
| 1. Measured shell | `img/transformation/build-01-shell.webp` | `img/transformation/build-01-shell-mobile.webp` | 5 |
| 2. Services and ceiling | `img/transformation/build-02-services.webp` | `img/transformation/build-02-services-mobile.webp` | 5 |
| 3. Joinery and stone | `img/transformation/build-03-joinery.webp` | `img/transformation/build-03-joinery-mobile.webp` | 5 |
| 4. Finishing and cleaning | `img/transformation/build-04-finishing.webp` | `img/transformation/build-04-finishing-mobile.webp` | 3 |
| 5. Completed design | `img/transformation/premium-complete.webp` | `img/transformation/premium-complete-mobile.webp` | 0 |

All four edited outputs are native 1672 × 941 pixels, encoded as WebP quality 89; mobile versions are 900 × 507 pixels at quality 83. Pillow was used only for deterministic resizing and encoding. All outputs were visually inspected for sensible worker anatomy/counts, distinct trades, construction progression and preservation of the camera, doorway and right window geometry. Minor synthesis differences in finishes and geometry can remain; this is an illustrative sequence, not measured construction photography.

### Exact prompts for the five-stage revision

#### build-01-shell

Edit target: `img/transformation/premium-complete.webp`.
Original selected output: `/home/hariharan/.codex/generated_images/01a08803-ef74-7250-9bf8-3bff284e65fa/exec-c5e1237a-5407-4c86-a430-16c42c9394c1.png`.

```text
Use case: precise-object-edit. Input image 1 is the exact edit target: preserve the EXACT camera position, lens, 16:9 image boundaries, perspective, all room wall planes, ceiling shape, left foreground wall volume, back-left doorway, bronze window mullion coordinates, right balcony openings and exterior palms. This is one stage of the SAME ROOM photographed from a LOCKED tripod. No camera shift, crop, zoom, architectural redesign or new openings. Documentary architectural photorealism, same warm afternoon daylight, coherent construction materials, believable body proportions, no text/logo/watermark/border. Preserve strong room depth; leave left foreground reasonably clear for website type.
Change the completed room backwards to the earliest measured shell stage. Remove all furniture, rug, chandelier, accessories, curtains, plants, walnut finishes, shelves and stone cladding. Keep exact underlying architecture, rough unpainted cement walls, unfinished grey cement floor and visible slab within the same ceiling boundaries. FIVE adult Indian interior construction professionals doing clearly different tasks around the middle/back/right: one measuring back wall with tape; one marking a level line by back doorway; two working together at a waist-height timber workbench on the right, one measuring a board and the other steadying it; one crouched inspecting floor measurements at center. Authentic workwear, boots, appropriate protective eyewear and gloves, natural working gestures, no posing. They must be large enough to read but realistically scaled to this room. Neatly stacked timber boards and small toolboxes, tidy active jobsite. Count exactly FIVE separate workers, no duplicated people, extra limbs or floating tools. Main room has no finished decorative joinery.
```

#### build-02-services

Edit target: `img/transformation/premium-complete.webp`.
Original selected output: `/home/hariharan/.codex/generated_images/01a08803-ef74-7250-9bf8-3bff284e65fa/exec-893f6891-b58e-4e30-9f6e-03efc56f5a25.png`.

```text
Use case: precise-object-edit. Input image 1 is the exact edit target: preserve the EXACT camera position, lens, 16:9 image boundaries, perspective, all room wall planes, ceiling shape, left foreground wall volume, back-left doorway, bronze window mullion coordinates, right balcony openings and exterior palms. This is one stage of the SAME ROOM photographed from a LOCKED tripod. No camera shift, crop, zoom, architectural redesign or new openings. Documentary architectural photorealism, same warm afternoon daylight, coherent construction materials, believable body proportions, no text/logo/watermark/border. Preserve strong room depth; leave left foreground reasonably clear for website type.
Change the finished room back to electrical and ceiling service installation stage. Remove all furniture, decorative joinery, shelving, stone cladding, chandelier, curtains, rug and decorative objects. Bare cement back wall with electrical conduits; partial light-gauge ceiling framing and neatly routed electrical services in the original ceiling footprint; floor protected in selected work areas. FIVE adult Indian tradespeople clearly working: electrician on a stable low platform fitting overhead conduit; assistant below handing up a small tool; technician by rear wall positioning an electrical box; carpenter at a right-center waist-high workbench measuring a timber piece; worker kneeling center-right organising closed cable reels. Practical work clothes, protective boots and appropriate ordinary PPE. No dangerously dangling live wires or theatrics. Natural anatomy and distinct credible roles. EXACT SAME reference room, camera and window geometry. Exactly FIVE workers, sensible spacing, not crowded.
```

#### build-03-joinery

Edit target: `img/transformation/premium-complete.webp`.
Original selected output: `/home/hariharan/.codex/generated_images/01a08803-ef74-7250-9bf8-3bff284e65fa/exec-03560905-188a-40dc-908f-6c1b8df28150.png`.

```text
Use case: precise-object-edit. Input image 1 is the exact edit target: preserve the EXACT camera position, lens, 16:9 image boundaries, perspective, all room wall planes, ceiling shape, left foreground wall volume, back-left doorway, bronze window mullion coordinates, right balcony openings and exterior palms. This is one stage of the SAME ROOM photographed from a LOCKED tripod. No camera shift, crop, zoom, architectural redesign or new openings. Documentary architectural photorealism, same warm afternoon daylight, coherent construction materials, believable body proportions, no text/logo/watermark/border. Preserve strong room depth; leave left foreground reasonably clear for website type.
Change this finished room to the joinery and stone fitting stage, with no loose furniture or rug yet. Back-wall central bookmatched travertine panel installed in EXACT final location and same vein layout. Walnut shelving carcass partly installed on center-left, some shelves and doors still missing; left foreground walnut panelling partly fitted over visible underlay. Stepped ceiling fitted with small unfinished plasterboard joints, chandelier absent with mounting plate only, warm cove lighting partly working, stone floor covered with tidy brown protective sheets. FIVE adult Indian professionals: two carpenters installing a shelf together at the back-left built-in; one fitter carefully checking the stone panel alignment at back center; one carpenter at a waist-height workbench right-center inspecting a cabinet door; one kneeling in foreground-right sorting hardware beside a closed toolbox. Real workwear and boots, appropriate safety glasses, convincing hands and poses, each visibly distinct. Preserve exact room/window/camera geometry and fixed composition. Single image, exactly FIVE workers.
```

#### build-04-finishing

Edit target: `img/transformation/premium-complete.webp`.
Original selected output: `/home/hariharan/.codex/generated_images/01a08803-ef74-7250-9bf8-3bff284e65fa/exec-03cc901f-3b6d-424d-abec-534866588f09.png`.

```text
Use case: precise-object-edit. Input image 1 is the exact edit target: preserve the EXACT camera position, lens, 16:9 image boundaries, perspective, all room wall planes, ceiling shape, left foreground wall volume, back-left doorway, bronze window mullion coordinates, right balcony openings and exterior palms. This is one stage of the SAME ROOM photographed from a LOCKED tripod. No camera shift, crop, zoom, architectural redesign or new openings. Documentary architectural photorealism, same warm afternoon daylight, coherent construction materials, believable body proportions, no text/logo/watermark/border. Preserve strong room depth; leave left foreground reasonably clear for website type.
Show the SAME living room at the final finishing/cleaning stage, just before its completed reveal. Preserve all installed walnut wall panels and shelving, exact central travertine veinpattern, fully finished steppedceiling, exact glass branchchandelier and rightwindows. The creamcurvedsofa and both taupechairs are now positioned EXACTLY as reference but partially covered with clean lightweight creamprotectivefabric; travertinecoffee table is inplace covered with protectivepaper, rug not unrolledyet. Retain floorprotection only around ongoingworkareas. THREE adult Indian interiorprofessionals working naturally: one carefully aligning a shelf/accessory at backleft; one in center checking a small finishingdetail on the low stonewallconsole; one on right vacuuming/cleaning the protectedfloor beside thesofa with a realcompactvacuum. Ordinary workshirts/trousers and cleanprotectivefootwear, no posing, naturalhand anatomy. Room looks90percent complete and materially luxurious but visibly being finished. Exactly THREE distinctworkers, avoid blocking the mainarchitecture, keep leftforeground clear. Do not change reference camera, frame, windows, doors, palms or furniturepositions.
```
