CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`digest` text NOT NULL,
	`added` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_metrics` (
	`expiry` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`low` integer NOT NULL,
	`out` integer NOT NULL,
	`value` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `medicine_active_identity` ON `medicines` (`identity`) WHERE "medicines"."deleted"=0;--> statement-breakpoint
CREATE INDEX `medicine_formula_search` ON `medicines` (lower("formula"),`identity`) WHERE "medicines"."deleted"=0;--> statement-breakpoint
CREATE INDEX `medicine_low_identity` ON `medicines` (`identity`) WHERE "medicines"."deleted"=0 AND "medicines"."stock"<="medicines"."minimum";--> statement-breakpoint
CREATE INDEX `medicine_out_identity` ON `medicines` (`identity`) WHERE "medicines"."deleted"=0 AND "medicines"."stock"=0;--> statement-breakpoint
CREATE INDEX `medicine_expiry_identity` ON `medicines` (`expiry`,`identity`) WHERE "medicines"."deleted"=0 AND "medicines"."expiry"!='';
--> statement-breakpoint
CREATE TRIGGER medicine_metrics_insert AFTER INSERT ON medicines WHEN EXISTS(SELECT 1 FROM settings WHERE key='inventory_metrics_ready') BEGIN
INSERT INTO inventory_metrics(expiry,count,low,out,value) SELECT NEW.expiry,1,(NEW.stock<=NEW.minimum),(NEW.stock=0),NEW.cost*NEW.stock WHERE NEW.deleted=0 ON CONFLICT(expiry) DO UPDATE SET count=count+1,low=low+excluded.low,out=out+excluded.out,value=value+excluded.value;
END;

--> statement-breakpoint
CREATE TRIGGER medicine_metrics_update AFTER UPDATE ON medicines WHEN EXISTS(SELECT 1 FROM settings WHERE key='inventory_metrics_ready') BEGIN
UPDATE inventory_metrics SET count=count-1, low=low-(OLD.stock<=OLD.minimum), out=out-(OLD.stock=0), value=value-OLD.cost*OLD.stock WHERE expiry=OLD.expiry AND OLD.deleted=0;
INSERT INTO inventory_metrics(expiry,count,low,out,value) SELECT NEW.expiry,1,(NEW.stock<=NEW.minimum),(NEW.stock=0),NEW.cost*NEW.stock WHERE NEW.deleted=0 ON CONFLICT(expiry) DO UPDATE SET count=count+1,low=low+excluded.low,out=out+excluded.out,value=value+excluded.value;
END;

--> statement-breakpoint
CREATE TRIGGER medicine_metrics_delete AFTER DELETE ON medicines WHEN EXISTS(SELECT 1 FROM settings WHERE key='inventory_metrics_ready') BEGIN
UPDATE inventory_metrics SET count=count-1, low=low-(OLD.stock<=OLD.minimum), out=out-(OLD.stock=0), value=value-OLD.cost*OLD.stock WHERE expiry=OLD.expiry AND OLD.deleted=0;
END;

--> statement-breakpoint
PRAGMA optimize;
