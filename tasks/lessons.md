# Lessons Learned

<!-- Format: [date] | what went wrong | rule to avoid it -->

| Date | Issue | Rule |
|------|-------|------|
| 2026-03-27 | Column I (Belgium Company Website) contains AI-generated text responses, not clean URLs. Real website domain is in column L (Domain Verification). | Always inspect actual sheet data before mapping columns — column headers can be misleading. |
| 2026-03-27 | Job Page URL column (M) contains markdown links `[text](url)` and failure text ("I was unable to...") mixed with clean URLs. | Parse Job Page URL field with regex to extract actual URLs, filter out AI failure text. |
| 2026-03-27 | LinkedIn matching in the sheet is catastrophically wrong for generic email domains: all gmail.com rows map to "Cambrew Ltd" (Cambodia), NOIS BVBA → "Estudio Tatuajes". | Fuzzy matching validation on LinkedIn company names is critical. Also filter on Valid domain=TRUE to skip rows with generic emails. |
| 2026-03-27 | Massive duplicates in sheet: ohgreen.eu x8, climagroup.be x8, vandecasteele.be x3. Multiple legal entities share the same email domain. | Deduplicate on email_domain early, keep first occurrence. |
| 2026-03-28 | Firecrawl extract() costs 21 credits per call and returns empty for Indeed. scrape() costs 1 credit and returns full markdown. | Use scrape() + regex parsing for job boards instead of extract(). extract() is better for company career pages where structure varies. |
| 2026-03-28 | Indeed multi-keyword queries ("IT developer software engineer devops") return 0 results. Short queries ("IT developer") return 15+ jobs. | Keep Indeed search queries to max 2 keywords. Split keyword lists into pairs. |
| 2026-03-28 | URL deduplicator stripped query params, so all Indeed redirect URLs (indeed.com/rc/clk?jk=X) matched as duplicates. 142 → 1 unique. | Include query string in URL dedup key — redirect URLs differ only by query params. |
| 2026-03-28 | Firecrawl cannot scrape Stepstone (HTTP/2 error) or LinkedIn Jobs ("Website Not Supported"). | Use per-board strategy: Indeed=Firecrawl scrape, LinkedIn=guest API (httpx+BS4), Stepstone=httpx+__PRELOADED_STATE__ JSON. |
| 2026-03-28 | LinkedIn guest API at /jobs-guest/jobs/api/seeMoreJobPostings/search returns 10 results per page with title, company, location, date, URL. Pagination via start param. | Free, reliable, no auth needed. Use precise CSS classes: h3.base-search-card__title, h4.base-search-card__subtitle, span.job-search-card__location. |
| 2026-03-28 | Stepstone embeds all search results as JSON in window.__PRELOADED_STATE__["app-unifiedResultlist"] with 25 items per page. Structured with id, title, companyName, location, datePosted, salary. | Direct httpx GET + JSON parse — no JS rendering needed. Much cheaper than Firecrawl. |
| 2026-03-28 | Stepstone detail pages block bot access (403 or timeout) even with realistic headers. Search pages work fine. | For Stepstone, collect all available data from search results (textSnippet, datePosted, salary). Don't rely on detail page enrichment. |
| 2026-03-28 | LinkedIn guest API has a detail endpoint at /jobs-guest/jobs/api/jobPosting/{jobId} that returns full HTML with description, employment type, date. No auth needed. | Use div.show-more-less-html__markup for description, ul.description__job-criteria-list for employment type, JSON-LD for datePosted. |
| 2026-03-28 | httpx timeout on large pages (597KB Stepstone) due to Python 3.9 LibreSSL. Default 20s too short. | Use timeout=60 for enrichment requests. For Stepstone detail pages, skip entirely if blocked. |
| 2026-03-28 | LinkedIn date_posted from search results is relative text ("3 days ago"), not ISO date. Normalizer couldn't parse it. | Add relative date parsing: regex for "N unit(s) ago" pattern → datetime subtraction. |
| 2026-03-28 | LinkedIn guest API detail endpoint (/jobs-guest/jobs/api/jobPosting/{id}) has no JSON-LD — only the public /jobs/view/ page does. | For LinkedIn enrichment, get description+criteria from HTML, don't rely on JSON-LD for dates. Use dates from initial search scrape. |
| 2026-03-28 | Normalizer _parse_date didn't handle ISO with milliseconds/timezone ("2026-03-24T15:01:20.817Z"). fromisoformat needs Z→+00:00. | Always try fromisoformat with Z replacement before format strings. |
