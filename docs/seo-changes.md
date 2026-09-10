# SEO and journal changes

The original site had 19 blog URLs: four long advice articles and 15 pages that largely repeated the homepage under different search terms or Chennai locality names. The journal depended on JavaScript to create its links. Several pages included unsupported price packages, testimonials, experience claims or publication dates; some headings were nested incorrectly and social image URLs were relative.

The journal now links to seven distinct, fully rendered guides. They cover preparing a Chennai interior project, choosing a designer, planning the work, budgeting, kitchens, bedrooms and compact homes. Each guide has one H1, its own title and description, an absolute canonical URL, social metadata, factual BlogPosting and breadcrumb structured data, and useful internal links. The site keeps its orange, white and charcoal palette and uses the same locally hosted fonts across the homepage and journal.

Images reused from the existing gallery are labelled as design references. They are not presented as verified completed projects. Unsupported prices and historical dates have been removed from the guides. Following the owner’s review, the five testimonials in the original supplied homepage were restored verbatim on the homepage; no star ratings, Google verification or review schema were invented. Undocumented original publication dates are omitted from existing-article structured data and the sitemap. New scheduled posts carry their actual creation/update dates through the renderer.

## Consolidated pages

These 12 URLs now redirect permanently to `/blog/best-interiors-in-chennai/`, the substantive Chennai planning guide. That guide explains preparation, building access, scope and confirming service availability at the customer's location. The original files contain readable fallback links and the destination canonical for environments that do not apply Firebase redirects.

- `/blog/best-interiors-in-annanagar/`
- `/blog/best-interiors-in-ecr/`
- `/blog/best-interiors-in-koyambedu/`
- `/blog/best-interiors-in-madipakkam/`
- `/blog/best-interiors-in-omr/`
- `/blog/best-interiors-in-perungudi/`
- `/blog/best-interiors-in-porur/`
- `/blog/best-interiors-in-tambaram/`
- `/blog/best-interiors-in-thiruvanmiyur/`
- `/blog/best-interiors-in-thuraipakkam/`
- `/blog/best-interiors-in-velacherry/`
- `/blog/top-interior-designers-in-sholinganallur/`

Each mapping covers the version without a trailing slash, with a trailing slash and with `/index.html`. The seven retained articles also redirect their `/index.html` aliases to the directory URL, and `/index.html` redirects to `/`. This preserves useful incoming links while removing repetitive locality pages from the sitemap. Existing slugs containing “best” remain solely to preserve their established URLs; the visible titles and copy do not claim a ranking.

## Technical checks and deployment

The baseline sitemap now contains the homepage, journal and seven retained guides. Generated posts are inserted between dedicated sitemap and journal markers by `scripts/blog-render.mjs`. All visible guide content and navigation work without JavaScript; JavaScript enhances mobile navigation.

Checks covered one H1, one description and one canonical per page; valid JSON-LD and XML; image alternative-text attributes; local link and asset existence; and all configured redirect destinations. Root-page and cross-page anchor checks are included in integration validation. Browser layout testing is a separate check.

Use the build output in `public/` with the supplied `firebase.json`; serving raw HTML alone does not activate HTTP redirects or cache headers. Directory articles retain trailing slashes and the journal retains `/blogs.html`. HTML, CSS and JavaScript revalidate after changes because their filenames are not content-hashed. Images and fonts use a seven-day cache; rename an asset if it needs immediate replacement.

After deployment, check representative retired URLs for a single 301 response to the guide, check the resulting page for a 200 response, submit `https://alankaarinteriors.com/sitemap.xml` in Search Console and monitor indexing. Local validation cannot report live indexing or search traffic. Blog scheduling and required account configuration are documented in [blog-automation.md](blog-automation.md).

## Sources

- [Google Search Central: consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) — matching permanent redirects, canonical targets and sitemap entries.
- [Google Search Central: redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects) — permanent HTTP redirects for retired pages.
- [Firebase Hosting configuration](https://firebase.google.com/docs/hosting/full-config) — redirect priority, headers and default directory trailing-slash behavior.
- [IKEA: kitchen measuring](https://www.ikea.com/ca/en/customer-service/services/kitchen-measuring/) — the kitchen guide's short measurement checklist reference.
- [IKEA: kitchen workflow](https://www.ikea.com/ca/en/rooms/kitchen/how-to/kitchen-layout-ideas-for-the-best-workflow-pubaa839870/) — the kitchen guide's short storage and layout reference.

The remaining guide copy is original planning guidance. It avoids invented project histories, prices, product specifications and guarantees.
