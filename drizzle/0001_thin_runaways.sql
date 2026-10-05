CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `expenses_date` ON `expenses` (`date`);--> statement-breakpoint
ALTER TABLE `invoices` ADD `subtotal` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `discount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `discounts` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `bill_type` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
CREATE INDEX `invoices_created` ON `invoices` (`created`);