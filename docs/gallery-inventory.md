# Design collection inventory

Gallery inventory verified on 2026-09-10. All original files are retained; the original collection has one exact duplicate represented by a single gallery entry.

| Category | Existing designs | New generated concepts | Total shown |
| --- | ---: | ---: | ---: |
| Living rooms | 26 | 15 | 41 |
| Kitchens | 14 | 15 | 29 |
| Bedrooms | 12 | 15 | 27 |
| Wardrobes | 10 | 15 | 25 |
| Dining | 3 | 15 | 18 |
| Pooja | 1 | 15 | 16 |
| Kids | 2 | 15 | 17 |
| Workspaces | 16 | 15 | 31 |
| Shops | 8 | 15 | 23 |
| Bathrooms | 9 | 15 | 24 |
| Balconies | 9 | 15 | 24 |
| Renovation | 9 | 15 | 24 |
| **Total** | **119** | **180** | **299** |

All 180 generated concepts have unique full-image hashes and a separately encoded 600px thumbnail. The 360 WebP files decode and match their recorded dimensions. Source prompts and provenance are retained in the three generated-designs documents.

The virtual studio's separate collection contains 40 native 4K spherical panoramas: 36 `gpt-image-2` concepts generated through the bundled image CLI/API at 3840 × 1920, plus four preserved original bedroom visualisations at 4096 × 2048. There are three generated views in each of 12 categories, giving Bedrooms seven views and every other category three. No former 1774 × 887 concept remains active.

All 40 designs now have an individually interpreted 3D model, replacing the former 12 category layouts. Each design offers four guided panorama highlights and four walking viewpoints: **160 highlights and 160 model viewpoints** in total. The model can also be orbited as a layout. The four original bedroom tours remain available. These alternate viewing modes, panoramas and thumbnails are not counted as additional gallery designs; the gallery total remains 299. The [virtual studio notes](virtual-studio.md) explain the distinction between a fixed-viewpoint panorama and camera movement inside its approximate 3D model.

The [exact generation jobs](../content/panorama-4k-jobs.jsonl) define the 36 generated designs; the [approval log](../content/panorama-4k-review.json) ties visual reviews to native source hashes. The matching-model update passed all 33 unit/source/model tests and both browser suites. All 40 models were visually accepted in layout and walking views after corrections, and browser checks rendered every design in all three modes. Detailed integration results are maintained in the [virtual studio notes](virtual-studio.md).

The build excludes source manifests, generation prompts, automation credentials and draft records.

Exact prompts and provenance: [Collection A](generated-designs-a.md), [Collection B](generated-designs-b.md), [Collection C](generated-designs-c.md), [panoramas](panorama-prompts.md), and [construction sequence](hero-image-prompts.md).
