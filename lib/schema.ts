import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const grants = sqliteTable("grants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sponsor: text("sponsor").notNull(),

  // Geographic scope
  level: text("level", { enum: ["federal", "state", "county", "city"] }).notNull(),
  state: text("state"),            // 2-letter, null for federal
  county: text("county"),          // for county-level
  city: text("city"),              // for city-level

  // Money
  programType: text("program_type", {
    enum: ["grant", "forgivable_loan", "deferred_loan", "low_interest_loan", "tax_credit", "voucher"],
  }).notNull(),
  amountMin: integer("amount_min"),
  amountMax: integer("amount_max"),
  amountDescription: text("amount_description"), // human-readable

  // Eligibility (flexible JSON)
  eligibility: text("eligibility", { mode: "json" })
    .$type<EligibilityRules>()
    .notNull(),
  summary: text("summary").notNull(),        // 1-2 sentence pitch
  detailedRequirements: text("detailed_requirements").notNull(), // longer form

  // Links
  applicationUrl: text("application_url").notNull(),
  sourceUrl: text("source_url").notNull(),

  // Meta
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  status: text("status", { enum: ["active", "paused", "ended"] }).notNull().default("active"),
  lastVerified: text("last_verified").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export type EligibilityRules = {
  firstTimeBuyerOnly?: boolean;
  veteranOnly?: boolean;
  professions?: string[];      // ["teacher", "firefighter", "nurse", ...]
  maxIncome?: number;          // dollars/year (household)
  maxIncomeAmiPct?: number;    // OR percent of Area Median Income
  minCreditScore?: number;
  maxPurchasePrice?: number;
  ownerOccupiedRequired?: boolean;
  homebuyerEducationRequired?: boolean;
  propertyTypes?: string[];    // ["single_family", "condo", "manufactured"]
  targetAreasOnly?: boolean;   // limited to specific neighborhoods
  notes?: string;              // anything else
};

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  phone: text("phone"),
  zip: text("zip"),
  state: text("state"),
  criteria: text("criteria", { mode: "json" }).$type<BuyerCriteria>().notNull(),
  matchedGrantIds: text("matched_grant_ids", { mode: "json" }).$type<string[]>().notNull(),
  wantsRealtor: integer("wants_realtor", { mode: "boolean" }).notNull().default(false),
  wantsDigest: integer("wants_digest", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type BuyerCriteria = {
  state: string;
  zip?: string;
  city?: string;
  county?: string;
  householdSize: number;
  annualIncome: number;
  targetPurchasePrice?: number;
  creditScore?: number;
  firstTimeBuyer: boolean;
  veteran: boolean;
  activeMilitary: boolean;
  profession?: string;
  ownerOccupied: boolean;
};

export const updateLog = sqliteTable("update_log", {
  id: text("id").primaryKey(),
  runAt: text("run_at").notNull().default(sql`(datetime('now'))`),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  source: text("source").notNull(),               // URL scraped
  changeType: text("change_type", { enum: ["new", "modified", "removed"] }).notNull(),
  grantId: text("grant_id"),                      // null for new
  diff: text("diff", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  reviewedAt: text("reviewed_at"),
  reviewedBy: text("reviewed_by"),
});

export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type UpdateLogEntry = typeof updateLog.$inferSelect;
