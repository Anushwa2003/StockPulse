-- Drop the insecure policies on stock_analysis_cache
DROP POLICY IF EXISTS insert_analysis_cache ON stock_analysis_cache;
DROP POLICY IF EXISTS update_analysis_cache ON stock_analysis_cache;
DROP POLICY IF EXISTS select_analysis_cache ON stock_analysis_cache;

-- stock_analysis_cache is public market data (shared across all users)
-- SELECT: Allow public read access - market analysis data should be public
CREATE POLICY "select_analysis_cache_public" ON stock_analysis_cache
  FOR SELECT TO PUBLIC USING (true);

-- INSERT: Only service role should be able to insert (backend processes)
-- Using (false) effectively blocks all inserts from authenticated users
-- Only service_role (which bypasses RLS) can insert
CREATE POLICY "insert_analysis_cache_service_only" ON stock_analysis_cache
  FOR INSERT TO authenticated WITH CHECK (false);

-- UPDATE: Only service role should be able to update (backend processes)
-- Using (false) effectively blocks all updates from authenticated users
-- Only service_role (which bypasses RLS) can update
CREATE POLICY "update_analysis_cache_service_only" ON stock_analysis_cache
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

-- DELETE: Only service role should be able to delete
CREATE POLICY "delete_analysis_cache_service_only" ON stock_analysis_cache
  FOR DELETE TO authenticated USING (false);