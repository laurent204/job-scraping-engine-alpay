# Job Harvester Engine — TODO

## Phase 1: Setup + Foundation ✅
- [x] Create project structure (all dirs + __init__.py)
- [x] Create requirements.txt + .env.example
- [x] Implement storage/models.py (SQLAlchemy models)
- [x] Implement storage/database.py (engine + session)
- [x] Implement config/settings.py
- [x] Implement config/segments.py
- [x] Implement config/job_page_patterns.py

## Phase 2: Google Sheet + Base Scraper ✅
- [x] Implement storage/google_sheet.py
- [x] Implement scrapers/base_scraper.py

## Phase 3: Part 1 Scrapers (Company-targeted) ✅
- [x] Implement scrapers/website_scraper.py
- [x] Implement scrapers/linkedin_company.py

## Phase 4: Part 2 Scrapers (Job boards) ✅
- [x] Implement scrapers/jobspy_scraper.py
- [x] Implement scrapers/stepstone_scraper.py

## Phase 5: Processors ✅
- [x] Implement processors/normalizer.py
- [x] Implement processors/deduplicator.py
- [x] Implement processors/classifier.py

## Phase 6: Orchestration + Infra ✅
- [x] Implement main.py
- [x] Implement scheduler.py
- [x] Implement notifications/alerter.py
- [x] Create docker-compose.yml + Dockerfile

## Phase 7: Dashboard + Scheduler Management ✅
- [x] Add Flask web framework
- [x] Refactor scheduler.py (BlockingScheduler → BackgroundScheduler + singleton)
- [x] Create web/ package with app factory
- [x] Create run_dashboard.py (unified entry point)
- [x] Dashboard overview page (KPIs + Chart.js charts)
- [x] Scrape Runs page (paginated table with status badges)
- [x] Jobs page (filterable by source, category, search)
- [x] Companies page (with job count)
- [x] Scheduler management UI (modify schedule, trigger manual run, pause/resume)
- [x] JSON API endpoints for charts (jobs-over-time, by-source, by-category)
- [x] Update docker-compose.yml (port 5000, new CMD)
- [x] Update .env.example (FLASK_SECRET_KEY)

## Next Steps
- [ ] Set up .env with real credentials
- [ ] Test Google Sheet reading
- [ ] Test each scraper individually with --dry-run
- [ ] Deploy with Docker
- [ ] Test dashboard: `python run_dashboard.py` → http://localhost:5000
