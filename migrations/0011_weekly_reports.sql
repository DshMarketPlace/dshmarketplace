-- Stored weekly reports (28 Oct 2026).
--
-- One row per issue, keyed by the plugin_stats day the week ends on. An issue
-- is frozen when it is written: `data` holds the measurements as JSON, so a
-- rename, a hide or a delete in the catalogue cannot rewrite a past week. The
-- table never touches `plugins`, so rule 7 does not apply; reads are by the
-- primary key or a scan of a few dozen small rows.
CREATE TABLE IF NOT EXISTS `weekly_reports` (
	`day` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
-- No ANALYZE: sqld rejects it over HTTP ("unsupported statement").
