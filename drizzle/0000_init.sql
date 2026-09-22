CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`district` text NOT NULL,
	`city` text NOT NULL,
	`linkedin_url` text,
	`company_name` text NOT NULL,
	`designation` text NOT NULL,
	`industry` text NOT NULL,
	`company_website` text,
	`year_founded` integer NOT NULL,
	`employee_range` text NOT NULL,
	`revenue_range` text NOT NULL,
	`interests` text NOT NULL,
	`referral_source` text NOT NULL,
	`motivation` text NOT NULL,
	`consent_pdpa` integer NOT NULL,
	`consent_marketing` integer DEFAULT false NOT NULL,
	`consent_version` text NOT NULL,
	`consented_at` integer NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_email_unique` ON `applications` (`email`);--> statement-breakpoint
CREATE INDEX `applications_status_idx` ON `applications` (`status`);--> statement-breakpoint
CREATE INDEX `applications_created_at_idx` ON `applications` (`created_at`);