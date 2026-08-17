CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_zh` text,
	`description` text,
	`slug` text NOT NULL,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `plugin_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plugin_id` integer NOT NULL,
	`day` text NOT NULL,
	`stars` integer DEFAULT 0 NOT NULL,
	`installs` integer DEFAULT 0 NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plugins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`repo_url` text NOT NULL,
	`homepage_url` text,
	`summary` text,
	`summary_zh` text,
	`overview` text,
	`readme_md` text,
	`category_id` text,
	`tags` text,
	`language` text,
	`stars` integer DEFAULT 0 NOT NULL,
	`forks` integer DEFAULT 0 NOT NULL,
	`open_issues` integer DEFAULT 0 NOT NULL,
	`license` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`repo_created_at` integer,
	`repo_pushed_at` integer,
	`install_kind` text DEFAULT 'unknown' NOT NULL,
	`npm_package` text,
	`install_cmd` text,
	`risk_flags` text,
	`provenance` text DEFAULT 'topic' NOT NULL,
	`in_registry` integer DEFAULT false NOT NULL,
	`screenshot` text,
	`og_image` text,
	`linuxdo_url` text,
	`linuxdo_title` text,
	`linuxdo_verified_at` integer,
	`visibility` text DEFAULT 'hidden' NOT NULL,
	`indexed_at` integer,
	`content_score` integer DEFAULT 0 NOT NULL,
	`install_count` integer DEFAULT 0 NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`synced_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repo_url` text NOT NULL,
	`note` text,
	`contact_email` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `plugin_stats_plugin_day_idx` ON `plugin_stats` (`plugin_id`,`day`);--> statement-breakpoint
CREATE UNIQUE INDEX `plugins_full_name_unique` ON `plugins` (`full_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `plugins_slug_unique` ON `plugins` (`slug`);--> statement-breakpoint
CREATE INDEX `plugins_visibility_idx` ON `plugins` (`visibility`);--> statement-breakpoint
CREATE INDEX `plugins_category_idx` ON `plugins` (`category_id`);--> statement-breakpoint
CREATE INDEX `plugins_stars_idx` ON `plugins` (`stars`);--> statement-breakpoint
CREATE INDEX `plugins_pushed_idx` ON `plugins` (`repo_pushed_at`);--> statement-breakpoint
CREATE INDEX `plugins_owner_idx` ON `plugins` (`owner`);