import { pgTable, uuid, text, date, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";
import { fieldPlotsTable } from "./field-plots";

export const advisorySchedulesTable = pgTable("advisory_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  plotId: uuid("plot_id").references(() => fieldPlotsTable.id, {
    onDelete: "cascade",
  }),
  farmerId: uuid("farmer_id")
    .notNull()
    .references(() => farmersTable.id, { onDelete: "cascade" }),
  cropType: text("crop_type").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  expectedHarvestDate: date("expected_harvest_date", { mode: "string" }).notNull(),
  scheduleTimeline: jsonb("schedule_timeline").notNull().$type<
    Array<{
      week: number;
      startDate: string;
      tasks: string[];
      category: string;
      notes?: string;
    }>
  >(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdvisoryScheduleSchema = createInsertSchema(advisorySchedulesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAdvisorySchedule = z.infer<typeof insertAdvisoryScheduleSchema>;
export type AdvisorySchedule = typeof advisorySchedulesTable.$inferSelect;
