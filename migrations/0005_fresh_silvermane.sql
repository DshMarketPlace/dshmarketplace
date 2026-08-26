CREATE TABLE `install_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`install` text,
	`status` text NOT NULL,
	`detail` text,
	`blocked_builds` text,
	`dsh_version` text,
	`pnpm_version` text,
	`ran_at` integer NOT NULL,
	`retracted_at` integer
);
--> statement-breakpoint
CREATE INDEX `install_runs_name_ran_idx` ON `install_runs` (`full_name`,`ran_at`);--> statement-breakpoint
INSERT INTO `install_runs` (`full_name`, `status`, `detail`, `blocked_builds`, `ran_at`)
SELECT `full_name`, `install_status`, `install_detail`, `blocked_builds`, coalesce(`install_checked_at`, unixepoch())
FROM `plugins`
WHERE `install_status` IS NOT NULL;
