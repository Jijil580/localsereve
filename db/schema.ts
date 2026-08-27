import { integer, real, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), email: text("email").notNull(), phone: text("phone"),
  fullName: text("full_name").notNull(), role: text("role", { enum: ["customer","provider","admin"] }).notNull().default("customer"),
  language: text("language").notNull().default("en"), status: text("status").notNull().default("active"),
  phoneVerified: integer("phone_verified", { mode: "boolean" }).notNull().default(false), ...timestamps,
}, t => [uniqueIndex("idx_users_email").on(t.email), uniqueIndex("idx_users_phone").on(t.phone)]);

export const addresses = sqliteTable("addresses", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), label: text("label"),
  addressLine: text("address_line").notNull(), locality: text("locality"), city: text("city").notNull(), district: text("district"),
  state: text("state").notNull(), pinCode: text("pin_code"), latitude: real("latitude"), longitude: real("longitude"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false), ...timestamps,
}, t => [index("idx_addresses_user").on(t.userId), index("idx_addresses_geo").on(t.latitude,t.longitude)]);

export const serviceCategories = sqliteTable("service_categories", {
  id: text("id").primaryKey(), parentId: text("parent_id"), name: text("name").notNull(), slug: text("slug").notNull(),
  icon: text("icon"), isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), sortOrder: integer("sort_order").default(0), ...timestamps,
}, t => [uniqueIndex("idx_categories_slug").on(t.slug), index("idx_categories_parent").on(t.parentId)]);

export const providerProfiles = sqliteTable("provider_profiles", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), businessName: text("business_name").notNull(),
  title: text("title").notNull(), description: text("description").notNull(), experienceYears: integer("experience_years").notNull().default(0),
  providerType: text("provider_type").notNull().default("individual"), teamSize: integer("team_size").default(1),
  latitude: real("latitude"), longitude: real("longitude"), serviceRadiusKm: integer("service_radius_km").default(20),
  languages: text("languages", { mode: "json" }).$type<string[]>().notNull().default([]), verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("pending"), availableNow: integer("available_now", { mode: "boolean" }).notNull().default(false),
  emergencyService: integer("emergency_service", { mode: "boolean" }).notNull().default(false), homeVisit: integer("home_visit", { mode: "boolean" }).notNull().default(true),
  averageRating: real("average_rating").notNull().default(0), reviewCount: integer("review_count").notNull().default(0), completedJobs: integer("completed_jobs").notNull().default(0), requestsReceived: integer("requests_received").notNull().default(0), ...timestamps,
}, t => [uniqueIndex("idx_provider_user").on(t.userId), index("idx_provider_geo").on(t.latitude,t.longitude), index("idx_provider_rating").on(t.averageRating)]);

export const providerServices = sqliteTable("provider_services", {
  id: text("id").primaryKey(), providerId: text("provider_id").notNull().references(() => providerProfiles.id), categoryId: text("category_id").notNull().references(() => serviceCategories.id),
  title: text("title").notNull(), description: text("description"), pricingModel: text("pricing_model").notNull(), startingPrice: integer("starting_price"),
  materialIncluded: integer("material_included", { mode: "boolean" }).notNull().default(false), warranty: text("warranty"), isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, t => [index("idx_services_provider").on(t.providerId), index("idx_services_category_price").on(t.categoryId,t.startingPrice)]);

export const portfolios = sqliteTable("portfolios", {
  id: text("id").primaryKey(), providerId: text("provider_id").notNull().references(() => providerProfiles.id), categoryId: text("category_id").references(() => serviceCategories.id),
  title: text("title").notNull(), description: text("description"), location: text("location"), completedOn: integer("completed_on", { mode: "timestamp" }),
  approximateCost: integer("approximate_cost"), duration: text("duration"), materials: text("materials"), visibility: text("visibility").notNull().default("public"), ...timestamps,
}, t => [index("idx_portfolios_provider").on(t.providerId)]);

export const portfolioMedia = sqliteTable("portfolio_media", {
  id: text("id").primaryKey(), portfolioId: text("portfolio_id").notNull().references(() => portfolios.id), objectKey: text("object_key").notNull(),
  mediaType: text("media_type").notNull(), stage: text("stage"), caption: text("caption"), sortOrder: integer("sort_order").default(0), ...timestamps,
}, t => [index("idx_portfolio_media_item").on(t.portfolioId)]);

export const serviceRequests = sqliteTable("service_requests", {
  id: text("id").primaryKey(), customerId: text("customer_id").notNull().references(() => users.id), categoryId: text("category_id").notNull().references(() => serviceCategories.id),
  addressId: text("address_id").references(() => addresses.id), description: text("description").notNull(), urgency: text("urgency").notNull().default("flexible"),
  preferredAt: integer("preferred_at", { mode: "timestamp" }), budgetMin: integer("budget_min"), budgetMax: integer("budget_max"), status: text("status").notNull().default("new_request"), ...timestamps,
}, t => [index("idx_requests_customer_status").on(t.customerId,t.status), index("idx_requests_category_status").on(t.categoryId,t.status)]);

export const quotations = sqliteTable("quotations", {
  id: text("id").primaryKey(), requestId: text("request_id").notNull().references(() => serviceRequests.id), providerId: text("provider_id").notNull().references(() => providerProfiles.id),
  labourCharge: integer("labour_charge").default(0), materialCharge: integer("material_charge").default(0), travelCharge: integer("travel_charge").default(0),
  inspectionCharge: integer("inspection_charge").default(0), tax: integer("tax").default(0), total: integer("total").notNull(), estimatedDuration: text("estimated_duration"),
  warranty: text("warranty"), terms: text("terms"), status: text("status").notNull().default("submitted"), expiresAt: integer("expires_at", { mode: "timestamp" }), ...timestamps,
}, t => [index("idx_quotes_request").on(t.requestId), index("idx_quotes_provider_status").on(t.providerId,t.status)]);

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(), customerId: text("customer_id").notNull().references(() => users.id), providerId: text("provider_id").notNull().references(() => providerProfiles.id),
  requestId: text("request_id").references(() => serviceRequests.id), quotationId: text("quotation_id").references(() => quotations.id), addressId: text("address_id").references(() => addresses.id),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(), status: text("status").notNull().default("confirmed"), finalAmount: integer("final_amount"), completionConfirmedAt: integer("completion_confirmed_at", { mode: "timestamp" }), ...timestamps,
}, t => [index("idx_bookings_customer_status").on(t.customerId,t.status), index("idx_bookings_provider_status").on(t.providerId,t.status), index("idx_bookings_schedule").on(t.scheduledAt)]);

export const bookingStatusHistory = sqliteTable("booking_status_history", {
  id: text("id").primaryKey(), bookingId: text("booking_id").notNull().references(() => bookings.id), status: text("status").notNull(), note: text("note"),
  changedBy: text("changed_by").notNull().references(() => users.id), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, t => [index("idx_booking_history").on(t.bookingId,t.createdAt)]);

export const conversations = sqliteTable("conversations", { id: text("id").primaryKey(), bookingId: text("booking_id").references(() => bookings.id), ...timestamps });
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(), conversationId: text("conversation_id").notNull().references(() => conversations.id), senderId: text("sender_id").notNull().references(() => users.id),
  type: text("type").notNull().default("text"), body: text("body"), objectKey: text("object_key"), readAt: integer("read_at", { mode: "timestamp" }), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, t => [index("idx_messages_conversation_time").on(t.conversationId,t.createdAt)]);

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(), bookingId: text("booking_id").notNull().references(() => bookings.id), customerId: text("customer_id").notNull().references(() => users.id), providerId: text("provider_id").notNull().references(() => providerProfiles.id),
  overall: integer("overall").notNull(), quality: integer("quality"), punctuality: integer("punctuality"), pricing: integer("pricing"), communication: integer("communication"),
  comment: text("comment"), recommended: integer("recommended", { mode: "boolean" }), status: text("status").notNull().default("published"), providerResponse: text("provider_response"), ...timestamps,
}, t => [uniqueIndex("idx_reviews_booking").on(t.bookingId), index("idx_reviews_provider_status").on(t.providerId,t.status)]);

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(), bookingId: text("booking_id").notNull().references(() => bookings.id), customerId: text("customer_id").notNull().references(() => users.id), providerId: text("provider_id").notNull().references(() => providerProfiles.id),
  gatewayReference: text("gateway_reference"), method: text("method").notNull(), amount: integer("amount").notNull(), tax: integer("tax").default(0), commission: integer("commission").default(0),
  status: text("status").notNull().default("pending"), paidAt: integer("paid_at", { mode: "timestamp" }), ...timestamps,
}, t => [index("idx_payments_booking").on(t.bookingId), index("idx_payments_provider_status").on(t.providerId,t.status)]);

export const subscriptionPlans = sqliteTable("subscription_plans", { id: text("id").primaryKey(), name: text("name").notNull(), priceMonthly: integer("price_monthly").notNull(), features: text("features", { mode: "json" }).$type<string[]>().notNull().default([]), isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), ...timestamps });
export const notifications = sqliteTable("notifications", { id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), type: text("type").notNull(), title: text("title").notNull(), body: text("body").notNull(), readAt: integer("read_at", { mode: "timestamp" }), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()) }, t => [index("idx_notifications_user_time").on(t.userId,t.createdAt)]);
export const verificationDocuments = sqliteTable("verification_documents", { id: text("id").primaryKey(), providerId: text("provider_id").notNull().references(() => providerProfiles.id), type: text("type").notNull(), objectKey: text("object_key").notNull(), status: text("status").notNull().default("pending"), reviewedBy: text("reviewed_by").references(() => users.id), ...timestamps }, t => [index("idx_verifications_provider_status").on(t.providerId,t.status)]);
export const auditLogs = sqliteTable("admin_audit_logs", { id: text("id").primaryKey(), adminId: text("admin_id").notNull().references(() => users.id), action: text("action").notNull(), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), metadata: text("metadata", { mode: "json" }).$type<Record<string,unknown>>(), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()) }, t => [index("idx_audit_entity").on(t.entityType,t.entityId), index("idx_audit_admin_time").on(t.adminId,t.createdAt)]);
