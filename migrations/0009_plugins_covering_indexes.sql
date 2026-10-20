-- Covering indexes for the catalogue's hot queries (20 Oct 2026).
--
-- readme_md and readme_html (~230 MB of a 370 MB table) sit mid-row, so a
-- query that touches any later column walks each row's README overflow
-- pages. On the self-hosted sqld every aggregate and every ?q= search read
-- the whole table: 5-11 s each, 12 GB of disk reads in the first 25 minutes.
-- Pages read on a copy of production, before -> after:
--   catalogue stats aggregate      239 MB -> 0
--   compatibility aggregate        161 MB -> 1 MB
--   search count                    97 MB -> 5 MB
--   search list, rare term         106 MB -> 5 MB
--   search list, verified only      24 MB -> 1 MB
--   LINUX DO list / count           48 MB -> 0.5 MB / 0
--   most installed                  47 MB -> 1 MB
CREATE INDEX IF NOT EXISTS `plugins_stats_cover_idx` ON `plugins` (`is_archived`, `install_status`, `install_dsh_version`, `visibility`, `synced_at`, `install_fallback`);
CREATE INDEX IF NOT EXISTS `plugins_search_cover_idx` ON `plugins` (`is_archived`, `stars`, `install_status`, `full_name`, `name`, `summary`, `summary_zh`, `tags`, `npm_package`);
CREATE INDEX IF NOT EXISTS `plugins_search_status_idx` ON `plugins` (`is_archived`, `install_status`, `stars`, `full_name`, `name`, `summary`, `summary_zh`, `tags`, `npm_package`);
CREATE INDEX IF NOT EXISTS `plugins_linuxdo_stars_idx` ON `plugins` (`is_archived`, `stars`) WHERE `linuxdo_url` IS NOT NULL;
CREATE INDEX IF NOT EXISTS `plugins_linuxdo_recent_idx` ON `plugins` (`is_archived`, `linuxdo_verified_at`, `stars`) WHERE `linuxdo_url` IS NOT NULL;
CREATE INDEX IF NOT EXISTS `plugins_visibility_slug_idx` ON `plugins` (`visibility`, `slug`);
CREATE INDEX IF NOT EXISTS `plugins_install_count_idx` ON `plugins` (`is_archived`, `install_count`);
-- No ANALYZE: sqld rejects it over HTTP ("unsupported statement"), and the
-- planner picks these same indexes without sqlite_stat1 (checked on the copy).
