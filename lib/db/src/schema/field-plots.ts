import { pgTable, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";

export const fieldPlotsTable = pgTable("field_plots", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmerId: uuid("farmer_id")
    .notNull()
    .references(() => farmersTable.id, { onDelete: "cascade" }),
  plotName: text("plot_name").notNull(),
  areaHectares: numeric("area_hectares", { precision: 8, scale: 2 }).notNull(),
  soilType: text("soil_type").notNull(),
  currentCrop: text("current_crop"),
  plantingDate: date("planting_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFieldPlotSchema = createInsertSchema(fieldPlotsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFieldPlot = z.infer<typeof insertFieldPlotSchema>;
export type FieldPlot = typeof fieldPlotsTable.$inferSelect;
