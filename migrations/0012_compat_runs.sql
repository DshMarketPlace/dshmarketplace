-- The upgrade check (/upgrade, /api/v1/compat): installs on npm `next` and
-- `alpha` of @deepseek-ai/dsh, kept apart from install_runs and
-- plugins.install_* — those describe `latest`, and retraction reads them.
-- Applied by hand, like 0005-0010. Append-only; latest row per
-- (full_name, dsh_tag) is the answer.
CREATE TABLE IF NOT EXISTS `compat_runs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `full_name` text NOT NULL,
  `dsh_tag` text NOT NULL,
  `dsh_version` text NOT NULL,
  `install` text,
  `status` text NOT NULL,
  `detail` text,
  `ran_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `compat_runs_name_tag_ran_idx` ON `compat_runs` (`full_name`, `dsh_tag`, `ran_at`);
CREATE INDEX IF NOT EXISTS `compat_runs_tag_version_idx` ON `compat_runs` (`dsh_tag`, `dsh_version`, `full_name`, `ran_at`);
-- /api/v1/compat looks up to 100 pasted names per request, uncached (the
-- keys are the caller's), and every plugins column it reads sits past the
-- README (CLAUDE.md rule 7). This keeps a request inside one index.
CREATE INDEX IF NOT EXISTS `plugins_compat_cover_idx` ON `plugins` (`full_name`, `is_archived`, `install_status`, `install_dsh_version`, `npm_package`, `visibility`, `slug`, `stars`);
