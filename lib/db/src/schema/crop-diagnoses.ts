import { pgTable, uuid, text, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";
import { fieldPlotsTable } from "./field-plots";

export const cropDiagnosesTable = pgTable("crop_diagnoses", {
  id: uuid("id").primaryKey().defaultRandom(),
  plotId: uuid("plot_id").references(() => fieldPlotsTable.id, {
    onDelete: "set null",
  }),
  farmerId: uuid("farmer_id")
    .notNull()
    .references(() => farmersTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  cropName: text("crop_name").notNull(),
  diseaseIdentified: text("disease_identified").notNull(),
  scientificName: text("scientific_name"),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }).notNull(),
  severityLevel: text("severity_level").notNull(),
  symptomsAnalysis: jsonb("symptoms_analysis").notNull().$type<string[]>(),
  immediateAction: text("immediate_action").notNull(),
  organicTreatment: jsonb("organic_treatment").notNull().$type<string[]>(),
  chemicalTreatment: jsonb("chemical_treatment").notNull().$type<string[]>(),
  preventiveMeasures: jsonb("preventive_measures").notNull().$type<string[]>(),
  localizedNote: text("localized_note"),
  rawAiResponse: jsonb("raw_ai_response").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCropDiagnosisSchema = createInsertSchema(cropDiagnosesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCropDiagnosis = z.infer<typeof insertCropDiagnosisSchema>;
export type CropDiagnosis = typeof cropDiagnosesTable.$inferSelect;
