CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text,
	`address_line` text NOT NULL,
	`locality` text,
	`city` text NOT NULL,
	`district` text,
	`state` text NOT NULL,
	`pin_code` text,
	`latitude` real,
	`longitude` real,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_addresses_user` ON `addresses` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_addresses_geo` ON `addresses` (`latitude`,`longitude`);--> statement-breakpoint
CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `admin_audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_admin_time` ON `admin_audit_logs` (`admin_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `booking_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`changed_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_booking_history` ON `booking_status_history` (`booking_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`request_id` text,
	`quotation_id` text,
	`address_id` text,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`final_amount` integer,
	`completion_confirmed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_customer_status` ON `bookings` (`customer_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_bookings_provider_status` ON `bookings` (`provider_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_bookings_schedule` ON `bookings` (`scheduled_at`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`body` text,
	`object_key` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_messages_conversation_time` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_time` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`gateway_reference` text,
	`method` text NOT NULL,
	`amount` integer NOT NULL,
	`tax` integer DEFAULT 0,
	`commission` integer DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payments_booking` ON `payments` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_provider_status` ON `payments` (`provider_id`,`status`);--> statement-breakpoint
CREATE TABLE `portfolio_media` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`object_key` text NOT NULL,
	`media_type` text NOT NULL,
	`stage` text,
	`caption` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_portfolio_media_item` ON `portfolio_media` (`portfolio_id`);--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`category_id` text,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`completed_on` integer,
	`approximate_cost` integer,
	`duration` text,
	`materials` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_portfolios_provider` ON `portfolios` (`provider_id`);--> statement-breakpoint
CREATE TABLE `provider_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`business_name` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`experience_years` integer DEFAULT 0 NOT NULL,
	`provider_type` text DEFAULT 'individual' NOT NULL,
	`team_size` integer DEFAULT 1,
	`latitude` real,
	`longitude` real,
	`service_radius_km` integer DEFAULT 20,
	`languages` text DEFAULT '[]' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`available_now` integer DEFAULT false NOT NULL,
	`emergency_service` integer DEFAULT false NOT NULL,
	`home_visit` integer DEFAULT true NOT NULL,
	`average_rating` real DEFAULT 0 NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`completed_jobs` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_provider_user` ON `provider_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_provider_geo` ON `provider_profiles` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `idx_provider_rating` ON `provider_profiles` (`average_rating`);--> statement-breakpoint
CREATE TABLE `provider_services` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`category_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`pricing_model` text NOT NULL,
	`starting_price` integer,
	`material_included` integer DEFAULT false NOT NULL,
	`warranty` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_services_provider` ON `provider_services` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_services_category_price` ON `provider_services` (`category_id`,`starting_price`);--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`labour_charge` integer DEFAULT 0,
	`material_charge` integer DEFAULT 0,
	`travel_charge` integer DEFAULT 0,
	`inspection_charge` integer DEFAULT 0,
	`tax` integer DEFAULT 0,
	`total` integer NOT NULL,
	`estimated_duration` text,
	`warranty` text,
	`terms` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_quotes_request` ON `quotations` (`request_id`);--> statement-breakpoint
CREATE INDEX `idx_quotes_provider_status` ON `quotations` (`provider_id`,`status`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`overall` integer NOT NULL,
	`quality` integer,
	`punctuality` integer,
	`pricing` integer,
	`communication` integer,
	`comment` text,
	`recommended` integer,
	`status` text DEFAULT 'published' NOT NULL,
	`provider_response` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reviews_booking` ON `reviews` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_provider_status` ON `reviews` (`provider_id`,`status`);--> statement-breakpoint
CREATE TABLE `service_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_categories_slug` ON `service_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_categories_parent` ON `service_categories` (`parent_id`);--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`category_id` text NOT NULL,
	`address_id` text,
	`description` text NOT NULL,
	`urgency` text DEFAULT 'flexible' NOT NULL,
	`preferred_at` integer,
	`budget_min` integer,
	`budget_max` integer,
	`status` text DEFAULT 'new_request' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_requests_customer_status` ON `service_requests` (`customer_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_requests_category_status` ON `service_requests` (`category_id`,`status`);--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_monthly` integer NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`full_name` text NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`phone_verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_phone` ON `users` (`phone`);--> statement-breakpoint
CREATE TABLE `verification_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`type` text NOT NULL,
	`object_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_verifications_provider_status` ON `verification_documents` (`provider_id`,`status`);