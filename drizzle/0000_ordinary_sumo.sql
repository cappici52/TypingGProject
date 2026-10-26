CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`stage` integer NOT NULL,
	`score` integer NOT NULL,
	`wpm` integer NOT NULL,
	`accuracy` integer NOT NULL,
	`cleared` integer NOT NULL,
	`created_at` integer NOT NULL
);
