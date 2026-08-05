import { pgTable, uuid, text, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";
import { fieldPlotsTable } from "./field-plots";

export const soilTestsTable = pgTable("soil_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  plotId: uuid("plot_id").references(() => fieldPlotsTable.id, {
    onDelete: "cascade",
  }),
  farmerId: uuid("farmer_id")
    .notNull()
    .references(() => farmersTable.id, { onDelete: "cascade" }),
  phLevel: numeric("ph_level", { precision: 4, scale: 2 }).notNull(),
  nitrogenPpm: numeric("nitrogen_ppm", { precision: 6, scale: 2 }).notNull(),
  phosphorusPpm: numeric("phosphorus_ppm", { precision: 6, scale: 2 }).notNull(),
  potassiumPpm: numeric("potassium_ppm", { precision: 6, scale: 2 }).notNull(),
  organicMatterPct: numeric("organic_matter_pct", { precision: 4, scale: 2 }),
  overallHealthRating: text("overall_health_rating").notNull(),
  phAnalysis: text("ph_analysis").notNull(),
  nutrientDeficiencies: jsonb("nutrient_deficiencies").notNull().$type<string[]>(),
  organicAmendments: jsonb("organic_amendments").notNull().$type<string[]>(),
  fertilizerRegimen: jsonb("fertilizer_regimen").notNull().$type<
    Array<{
      stage: string;
      fertilizerName: string;
      dosageKgPerHa: number;
      applicationMethod: string;
    }>
  >(),
  irrigationAdvice: text("irrigation_advice").notNull(),
  rawAiResponse: jsonb("raw_ai_response").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSoilTestSchema = createInsertSchema(soilTestsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSoilTest = z.infer<typeof insertSoilTestSchema>;
export type SoilTest = typeof soilTestsTable.$inferSelect;
