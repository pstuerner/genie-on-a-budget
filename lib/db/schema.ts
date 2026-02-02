import type { InferSelectModel } from "drizzle-orm";
import {
  bigserial,
  boolean,
  foreignKey,
  index,
  integer,
  json,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const products = pgTable(
  "Product",
  {
    // Primary key: parent ASIN groups product variants together
    parentAsin: text("parent_asin").primaryKey().notNull(),
    
    // Representative variant ASIN (one of potentially many variants)
    asin: text("asin").notNull(),
    
    // product identity
    title: text("title"),
    store: text("store"),
    
    // pricing & ratings (product-level aggregates)
    price: numeric("price", { precision: 12, scale: 2 }),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
    ratingNumber: integer("rating_number"),
    
    // rich product content
    description: text("description"),
    features: json("features").$type<string[]>(),
    
    images: json("images"),
    videos: json("videos"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    asinIdx: index("idx_products_asin").on(table.asin),
  })
);

export type Product = InferSelectModel<typeof products>;

export const reviews = pgTable(
  "Review",
  {
    reviewId: bigserial("review_id", { mode: "number" }).primaryKey().notNull(),
    
    // Foreign key to product group
    parentAsin: text("parent_asin")
      .notNull()
      .references(() => products.parentAsin),
    
    // Original variant ASIN that was reviewed
    asin: text("asin").notNull(),
    
    // reviewer & metadata
    userId: text("user_id"),
    verifiedPurchase: boolean("verified_purchase"),
    helpfulVote: integer("helpful_vote"),
    
    // review content
    rating: smallint("rating"),
    reviewTitle: text("review_title"),
    reviewText: text("review_text"),
    
    images: json("images"),
    
    // time
    reviewTimestamp: timestamp("review_timestamp", { withTimezone: true }),
    
    // traceability
    sourceRowId: integer("source_row_id"),
  },
  (table) => ({
    parentAsinIdx: index("idx_reviews_parent_asin").on(table.parentAsin),
    asinIdx: index("idx_reviews_asin").on(table.asin),
    timestampIdx: index("idx_reviews_timestamp").on(table.reviewTimestamp),
    ratingIdx: index("idx_reviews_rating").on(table.rating),
  })
);

export type Review = InferSelectModel<typeof reviews>;
