import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  boolean,
  bigint,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const memberRoleEnum = pgEnum("member_role", ["OWNER", "ADMIN", "MEMBER"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "trialing",
  "unpaid",
  "free",
]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "pro", "business"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  passwordHash: text("password_hash"),
  emailVerified: timestamp("email_verified"),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Password Reset Tokens ─────────────────────────────────────────────────────
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Organizations ────────────────────────────────────────────────────────────
export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("organizations_slug_idx").on(t.slug)]
);

// ─── Notifications (إشعارات داخلية للوحة التحكم) ───────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // order | member | system
    title: text("title").notNull(),
    message: text("message"),
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("notifications_org_idx").on(t.organizationId)]
);

// ─── Memberships ──────────────────────────────────────────────────────────────
export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("MEMBER"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("memberships_user_org_idx").on(t.userId, t.organizationId),
    index("memberships_org_idx").on(t.organizationId),
    index("memberships_user_idx").on(t.userId),
  ]
);

// ─── Invitations ──────────────────────────────────────────────────────────────
export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("MEMBER"),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("invitations_org_idx").on(t.organizationId)]
);

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  chargilyCheckoutId: text("chargily_checkout_id"),
  plan: subscriptionPlanEnum("plan").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("free"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Usage Records ────────────────────────────────────────────────────────────
export const usageRecords = pgTable("usage_records", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  memberCount: integer("member_count").notNull().default(1),
  storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).notNull().default(0),
  productCount: integer("product_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Store Settings (Theme) ───────────────────────────────────────────────────
export const storeSettings = pgTable("store_settings", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  isPublished: boolean("is_published").notNull().default(false),
  description: text("description"),
  bannerUrl: text("banner_url"),
  themeColor: text("theme_color").notNull().default("#16a34a"),
  currency: text("currency").notNull().default("DZD"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  announcementText: text("announcement_text"),
  socialInstagram: text("social_instagram"),
  socialFacebook: text("social_facebook"),
  socialTelegramChannel: text("social_telegram_channel"),
  socialWhatsapp: text("social_whatsapp"),
  aboutText: text("about_text"),
  returnPolicyText: text("return_policy_text"),
  privacyPolicyText: text("privacy_policy_text"),
  termsText: text("terms_text"),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  facebookPixelId: text("facebook_pixel_id"),
  // بيانات Cloudinary مخصصة لهذا المتجر (تُضبط من لوحة الأدمن فقط) — إن فُضّيت
  // فارغة، يُستخدم حساب Cloudinary المشترك للمنصة تلقائيًا.
  cloudinaryCloudName: text("cloudinary_cloud_name"),
  cloudinaryApiKey: text("cloudinary_api_key"),
  cloudinaryApiSecret: text("cloudinary_api_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("categories_org_slug_idx").on(t.organizationId, t.slug),
    index("categories_org_idx").on(t.organizationId),
  ]
);

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    basePriceCents: integer("base_price_cents").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("products_org_slug_idx").on(t.organizationId, t.slug),
    index("products_org_idx").on(t.organizationId),
    index("products_category_idx").on(t.categoryId),
  ]
);

// ─── Product Variants ─────────────────────────────────────────────────────────
export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // مثال: "أحمر / L"
    sku: text("sku"),
    priceCents: integer("price_cents"), // إذا فاضي، يستخدم سعر المنتج الأساسي
    stockQuantity: integer("stock_quantity").notNull().default(0),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("product_variants_product_idx").on(t.productId)]
);

// ─── Customers (زبائن المتجر، مختلفين عن مستخدمي لوحة التحكم) ──────────────────
export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("customers_org_idx").on(t.organizationId),
    index("customers_org_phone_idx").on(t.organizationId, t.phone),
  ]
);

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    totalCents: integer("total_cents").notNull().default(0),
    currency: text("currency").notNull().default("DZD"),
    chargilyCheckoutId: text("chargily_checkout_id"),
    shippingAddress: text("shipping_address"),
    wilayaCode: integer("wilaya_code"),
    wilayaName: text("wilaya_name"),
    commune: text("commune"),
    deliveryType: text("delivery_type"), // "home" | "desk"
    deliveryPriceCents: integer("delivery_price_cents").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("orders_org_idx").on(t.organizationId),
    index("orders_customer_idx").on(t.customerId),
    index("orders_chargily_checkout_idx").on(t.chargilyCheckoutId),
  ]
);

// ─── Blocked Phones (حماية من الطلبات الوهمية COD) ─────────────────────────────
// organizationId = null  →  حظر على مستوى المنصة كلها (كل المتاجر)
// organizationId = معرّف  →  حظر خاص بمتجر واحد فقط
export const blockedPhones = pgTable(
  "blocked_phones",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull(),
    organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    reason: text("reason"),
    blockedByUserId: text("blocked_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("blocked_phones_phone_idx").on(t.phone),
    index("blocked_phones_org_idx").on(t.organizationId),
  ]
);

// ─── Login Attempts (Rate limiting لتسجيل الدخول) ──────────────────────────────
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: text("id").primaryKey(),
    // مفتاح التحديد: IP أو IP+email مجمّعين معًا (نخزّن سلسلة جاهزة لتفادي join)
    identifierKey: text("identifier_key").notNull(),
    success: boolean("success").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("login_attempts_key_idx").on(t.identifierKey),
    index("login_attempts_created_idx").on(t.createdAt),
  ]
);

// ─── Checkout Attempts (Rate limiting على إنشاء الطلبات حسب IP) ───────────────
// يمنع بوت من إغراق متجر بطلبات وهمية بأرقام هواتف مختلفة من نفس الجهاز —
// وهي ثغرة لا يغطيها فحص سرعة الرقم (checkOrderVelocity) لأنه مبني على الهاتف فقط.
export const checkoutAttempts = pgTable(
  "checkout_attempts",
  {
    id: text("id").primaryKey(),
    identifierKey: text("identifier_key").notNull(), // ip:x.x.x.x
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("checkout_attempts_key_idx").on(t.identifierKey),
    index("checkout_attempts_created_idx").on(t.createdAt),
  ]
);

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(), // snapshot وقت الطلب
    variantName: text("variant_name"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  sessions: many(sessions),
  invitations: many(invitations),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  memberships: many(memberships),
  subscription: one(subscriptions, {
    fields: [organizations.id],
    references: [subscriptions.organizationId],
  }),
  usageRecord: one(usageRecords, {
    fields: [organizations.id],
    references: [usageRecords.organizationId],
  }),
  invitations: many(invitations),
  storeSettings: one(storeSettings, {
    fields: [organizations.id],
    references: [storeSettings.organizationId],
  }),
  categories: many(categories),
  products: many(products),
  customers: many(customers),
  orders: many(orders),
}));

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [storeSettings.organizationId],
    references: [organizations.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [categories.organizationId],
    references: [organizations.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orders.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedById],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
}));

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  organization: one(organizations, {
    fields: [usageRecords.organizationId],
    references: [organizations.id],
  }),
}));

export const blockedPhonesRelations = relations(blockedPhones, ({ one }) => ({
  organization: one(organizations, {
    fields: [blockedPhones.organizationId],
    references: [organizations.id],
  }),
  blockedBy: one(users, {
    fields: [blockedPhones.blockedByUserId],
    references: [users.id],
  }),
}));

