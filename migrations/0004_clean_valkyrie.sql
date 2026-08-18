CREATE TABLE `ingest_rejections` (
	`full_name` text PRIMARY KEY NOT NULL,
	`reason` text NOT NULL,
	`pushed_at` integer NOT NULL,
	`checked_at` integer DEFAULT (unixepoch()) NOT NULL
);
