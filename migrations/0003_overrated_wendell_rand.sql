ALTER TABLE `plugins` ADD `install_status` text;--> statement-breakpoint
ALTER TABLE `plugins` ADD `install_detail` text;--> statement-breakpoint
ALTER TABLE `plugins` ADD `blocked_builds` text;--> statement-breakpoint
ALTER TABLE `plugins` ADD `install_checked_at` integer;--> statement-breakpoint
ALTER TABLE `plugins` ADD `review` text;--> statement-breakpoint
ALTER TABLE `plugins` ADD `review_zh` text;--> statement-breakpoint
ALTER TABLE `plugins` ADD `review_html` text;--> statement-breakpoint
ALTER TABLE `plugins` ADD `review_html_zh` text;--> statement-breakpoint
ALTER TABLE `plugins` ADD `review_model` text;--> statement-breakpoint
ALTER TABLE `plugins` ADD `reviewed_at` integer;
