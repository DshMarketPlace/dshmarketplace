-- Indexes for category pages, the other catalogue sorts and npm-name lookups
-- (20 Oct 2026), the second half of 0009. Pages read on a copy of
-- production, before -> after:
--   getCategoriesWithCounts (categories LEFT JOIN plugins)  3,377 MB -> 0.2 MB
--   category page, by stars / updated / new / name           119-147 MB -> 0-1 MB
--   whole catalogue, newest first                              241 MB -> 1.5 MB
--   getPluginsByNpmName (npm_package IN ...)                   101 MB -> 0.4 MB
CREATE INDEX IF NOT EXISTS `plugins_category_stars_idx` ON `plugins` (`category_id`, `is_archived`, `stars`);
CREATE INDEX IF NOT EXISTS `plugins_category_pushed_idx` ON `plugins` (`category_id`, `is_archived`, `repo_pushed_at`);
CREATE INDEX IF NOT EXISTS `plugins_category_created_idx` ON `plugins` (`category_id`, `is_archived`, `created_at`);
CREATE INDEX IF NOT EXISTS `plugins_category_name_idx` ON `plugins` (`category_id`, `is_archived`, `full_name`);
CREATE INDEX IF NOT EXISTS `plugins_category_installs_idx` ON `plugins` (`category_id`, `is_archived`, `install_count`);
CREATE INDEX IF NOT EXISTS `plugins_category_linuxdo_idx` ON `plugins` (`category_id`, `is_archived`) WHERE `linuxdo_url` IS NOT NULL;
CREATE INDEX IF NOT EXISTS `plugins_archived_created_idx` ON `plugins` (`is_archived`, `created_at`);
CREATE INDEX IF NOT EXISTS `plugins_npm_package_idx` ON `plugins` (`npm_package`);
