ALTER TABLE `medicines` ADD `needsReview` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `medicines` ADD `importNotes` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `medicine_review_identity` ON `medicines` (`identity`) WHERE "medicines"."deleted"=0 AND "medicines"."needsReview"=1;