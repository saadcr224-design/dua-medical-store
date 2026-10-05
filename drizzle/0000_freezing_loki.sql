CREATE TABLE `attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`created` text NOT NULL,
	`customer` text NOT NULL,
	`items` text NOT NULL,
	`total` integer NOT NULL,
	`paid` integer NOT NULL,
	`applied` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`formula` text NOT NULL,
	`strength` text NOT NULL,
	`manufacturer` text NOT NULL,
	`category` text NOT NULL,
	`barcode` text,
	`identity` text NOT NULL,
	`unit` text NOT NULL,
	`price` integer NOT NULL,
	`cost` integer NOT NULL,
	`stock` integer NOT NULL,
	`minimum` integer NOT NULL,
	`expiry` text NOT NULL,
	`rack` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medicine_identity` ON `medicines` (`identity`);--> statement-breakpoint
CREATE UNIQUE INDEX `medicine_barcode` ON `medicines` (`barcode`);--> statement-breakpoint
CREATE TABLE `operations` (
	`id` text PRIMARY KEY NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
