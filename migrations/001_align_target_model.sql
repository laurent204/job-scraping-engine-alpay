-- Migration 001: Align schema with target data model
-- Run against Supabase PostgreSQL

BEGIN;

-- =====================================================
-- COMPANIES TABLE
-- =====================================================

-- Renames
ALTER TABLE companies RENAME COLUMN email_domain TO domain;
ALTER TABLE companies RENAME COLUMN postal_code TO zip;
ALTER TABLE companies RENAME COLUMN city TO locality;
ALTER TABLE companies RENAME COLUMN website_url TO company_url;

-- New columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS region VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_linkedin_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_group_s_client BOOLEAN DEFAULT true;

-- Update index
DROP INDEX IF EXISTS ix_companies_email_domain;
CREATE UNIQUE INDEX IF NOT EXISTS ix_companies_domain ON companies(domain);

-- =====================================================
-- JOBS TABLE
-- =====================================================

-- Renames
ALTER TABLE jobs RENAME COLUMN segment TO category;
ALTER TABLE jobs RENAME COLUMN language TO source_language;

-- contract_type: VARCHAR(50) -> TEXT[]
-- Step 1: Add new array column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contract_type_arr TEXT[];
-- Step 2: Migrate existing job_type data into array
UPDATE jobs SET contract_type_arr = ARRAY[job_type] WHERE job_type IS NOT NULL AND job_type != '';
-- Step 3: Drop old column
ALTER TABLE jobs DROP COLUMN IF EXISTS job_type;
-- Step 4: Rename new column
ALTER TABLE jobs RENAME COLUMN contract_type_arr TO contract_type;

-- New columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS zip VARCHAR(10);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS locality VARCHAR(100);

-- Set default scraped_at from existing data
UPDATE jobs SET scraped_at = COALESCE(date_discovered, created_at) WHERE scraped_at IS NULL;

-- Set is_active based on status
UPDATE jobs SET is_active = (status != 'closed') WHERE is_active IS NULL;

-- Update indexes
DROP INDEX IF EXISTS ix_jobs_segment;
CREATE INDEX IF NOT EXISTS ix_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS ix_jobs_external_id ON jobs(external_id);
CREATE INDEX IF NOT EXISTS ix_jobs_is_active ON jobs(is_active);

COMMIT;
