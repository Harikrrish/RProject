# Alankaar journal automation

The repository includes a scheduler that researches one useful Chennai interior topic, prepares an original article with a relevant local image, and opens a **draft pull request**. It does not deploy the website or publish without review. The schedule is Monday, Wednesday and Friday at 09:00 India time: up to three articles a week, never more than one candidate a day. Skipped slots are not backfilled. This is an editorial choice to leave room for useful research and checking; there is no SEO benefit assumed from posting every day.

## Enable it

1. Put this workflow and the accompanying scripts on the GitHub repository's default branch.
2. In **Settings → Secrets and variables → Actions**, add the repository secret `OPENAI_API_KEY`. Use an API project with web search access and a budget appropriate to your business. The key is read only by the GitHub runner or local Node process, never by the browser or Firebase pages. [GitHub documents how to add and use Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).
3. Add the repository variable `BLOG_AUTOMATION_ENABLED` with the value `true`. Optionally set `OPENAI_BLOG_MODEL` to a model your API project can access that supports both Responses web search and Structured Outputs. The configured default is `gpt-5.5`, whose official model page lists both capabilities. [OpenAI model documentation](https://developers.openai.com/api/docs/models/gpt-5.5).
4. In **Settings → Actions → General → Workflow permissions**, allow Actions to create pull requests and use read/write repository permissions. Organisation restrictions may need an administrator to change them. The workflow requests only repository contents and pull-request permissions.
5. Run **Actions → Interior journal research and draft → Run workflow** with `dry_run` checked. Review the setup report. Then run once with `dry_run` unchecked to test the live path and inspect the resulting draft.

These settings and a working key are required before scheduled generation is active. The code was validated locally with mocked API responses; it has not spent API credits or created a remote PR as part of this website update. GitHub schedules run from the default branch and may be delayed; public repositories can have schedules disabled after inactivity. Check the Actions run history instead of treating the scheduled minute as a delivery guarantee. [GitHub schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## What each run does

1. Checks for an existing editorial draft and the daily/weekly cap, including recently closed PRs. One pending draft pauses further generation so a backlog cannot accumulate.
2. Searches at least two configured competitors (Livspace, HomeLane and DesignCafe) and approved primary sources for a relevant gap in their coverage. It considers Chennai apartments, storage, kitchens, humidity, renovation, lighting and budget planning. Competitor coverage is topic research, not a source of Alankaar project claims.
3. Produces a 650–1,200 word structured article with a clear title, description, practical sections, source references and approved internal links. The generator calls the Responses API directly using Node's `fetch`; no extra AI SDK or browser credential is required. The research request enables `web_search` and includes the actual consulted URLs. [OpenAI web search documentation](https://developers.openai.com/api/docs/guides/tools-web-search).
4. Fetches each cited page from a configured HTTPS host with timeouts, redirect checks and a size limit. Each source must have appeared in live research, and a short evidence excerpt must match the page. At least two independent final destination domains, a competitor source and a primary source are required; a primary URL redirecting to a competitor does not count as a primary source. At least one source must have a verified published/updated date within 120 days. Dates must come from head-level `article:published_time`/`article:modified_time` metadata or typed Article/BlogPosting JSON-LD tied to the actual final/canonical page. Generic time elements, sidebar stories, unrelated JSON objects and footer copyright years cannot establish freshness. Unreadable or undated evidence can cause a slot to be skipped.
5. Runs length, relevance, repeated-title/content, unsupported-business-claim and safe-link checks, and rejects twelve-word verbatim passages found anywhere in the full bounded fetched source text. A separate editorial API request assesses factual support and readable wording using article content or a window around the verified excerpt, always including that excerpt. Long navigation menus cannot displace the evidence used for this review. The article and review use strict JSON schemas, with runtime validation before rendering. [OpenAI Structured Outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs).
6. Writes `content/posts/<slug>.json` and a private-build research record in `content/research/`. Then renders a static article, journal card and sitemap URL, runs the site checks and opens the draft PR. Raw fetched source pages are not stored in the repository.

There are up to three model requests per successful run, with bounded output and at most six research tool calls. Actual costs depend on the selected model, tool usage and input length. Failed API calls are not automatically retried to avoid duplicate charges. A run that cannot substantiate a current topic produces no article.

## Review and publish

Read the article and its matching research JSON, especially `whyNow`, `competitorGap`, source dates and image provenance. Follow the cited links and check the advice. Automated checks reduce common problems but cannot guarantee factual accuracy, originality or search rankings. The proposed date is the preparation date; update `createdOn` if publication happens substantially later, and set `updatedOn` only when the article actually changes.

Edit the record in `content/posts/`, run `npm run blog:render`, then `npm run build` and `npm test`. The `ready` status means ready for a rendered PR preview, not that a person has already approved it. Mark the PR ready for review and merge once the article is suitable for customers. The normal Firebase deployment then publishes it. There is deliberately no auto-merge or automatic Firebase deployment in this editorial workflow.

Do not change a generated post to draft to withdraw an already published page: remove its generated HTML folder and source record in the same change, then rerender the listing/sitemap. Use an appropriate redirect when replacing a published URL. Manually maintained core guides are protected from overwrite by the renderer.

## Images and configuration

`content/blog-config.json` contains the business facts, competitor list, primary-source allowlist, cadence, article limits and internal links. Edit both the workflow cron and configuration when changing publishing days. Manual live runs may bypass the weekday restriction but retain the daily and weekly caps. Disabling `BLOG_AUTOMATION_ENABLED` stops new live runs; already published pages stay available.

`content/blog-images.json` is the image catalogue. The three original entries reuse images already present on the website and are labelled **design references**, because the repository does not identify their photographer, original licence or a documented Alankaar client project. Three additional editorial illustrations show materials and a floor plan, kitchen drawer storage, and a compact apartment. Their `generated-illustration` records, visible captions and credits identify them as AI-generated concepts. The scheduler can select these for relevant planning, budget, kitchen and small-home articles. No image is presented as evidence of an actual client home, installed product or completed job, and no third-party image is scraped or downloaded by the scheduler.

For real project photography, add an optimised WebP/JPEG under `img/`, record a unique ID, path, accurate alt text, caption, photographer credit, source URL, permission/provenance notes, topics and `kind: "project-photo"`. Only use a project name, location or before/after claim if those details are verified and appropriate to publish. The generator chooses from this catalogue; it cannot invent image paths. The image credit and caption appear on the article.

## Local commands

Requires Node 22 or newer.

```bash
npm run blog:dry-run
node scripts/blog-generate.mjs --dry-run --manual
npm run blog:generate
npm run blog:render
npm run build
npm test
```

For a local live run, set `OPENAI_API_KEY` in your process environment; the script does not automatically load `.env`. Do not commit keys. `--dry-run` makes no API calls and writes no files. Running the generator locally writes a candidate only; it does not create a PR. The workflow owns that step.

The static renderer shares `/css/site.css`, `/css/journal.css` and `/js/site.js` with the rest of the site. It edits only marked generated sections of `blogs.html` and `sitemap.xml`, and refuses to overwrite an existing manually maintained guide. API scripts, research files and content records are excluded from the public Firebase build.
