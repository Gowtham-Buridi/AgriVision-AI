import { Router, type IRouter } from "express";
import { eq, desc, count, and, isNull } from "drizzle-orm";
import { db, cropDiagnosesTable, soilTestsTable, advisorySchedulesTable } from "@workspace/db";
import {
  ListDiagnosesQueryParams,
  ListSoilTestsQueryParams,
  ListSchedulesQueryParams,
} from "@workspace/api-zod";
import { getOrCreateDefaultFarmer } from "../lib/farmer-context";

const router: IRouter = Router();

router.get("/history/diagnoses", async (req, res): Promise<void> => {
  const params = ListDiagnosesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();
  const page = params.data.page ?? 1;
  const limit = params.data.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(cropDiagnosesTable.farmerId, farmer.id)];
  if (params.data.plotId) {
    conditions.push(eq(cropDiagnosesTable.plotId, params.data.plotId));
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [items, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(cropDiagnosesTable)
      .where(whereClause)
      .orderBy(desc(cropDiagnosesTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(cropDiagnosesTable).where(whereClause),
  ]);

  res.json({
    items: items.map((d) => ({
      id: d.id,
      plotId: d.plotId ?? null,
      cropName: d.cropName,
      diseaseIdentified: d.diseaseIdentified,
      scientificName: d.scientificName ?? null,
      confidenceScore: parseFloat(d.confidenceScore),
      severityLevel: d.severityLevel,
      symptomsAnalysis: d.symptomsAnalysis,
      immediateAction: d.immediateAction,
      organicTreatment: d.organicTreatment,
      chemicalTreatment: d.chemicalTreatment,
      preventiveMeasures: d.preventiveMeasures,
      localizedNote: d.localizedNote ?? null,
      imageUrl: d.imageUrl,
      createdAt: d.createdAt.toISOString(),
    })),
    total: Number(total),
    page,
    limit,
  });
});

router.get("/history/soil-tests", async (req, res): Promise<void> => {
  const params = ListSoilTestsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();
  const page = params.data.page ?? 1;
  const limit = params.data.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(soilTestsTable.farmerId, farmer.id)];
  if (params.data.plotId) {
    conditions.push(eq(soilTestsTable.plotId, params.data.plotId));
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [items, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(soilTestsTable)
      .where(whereClause)
      .orderBy(desc(soilTestsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(soilTestsTable).where(whereClause),
  ]);

  res.json({
    items: items.map((t) => ({
      id: t.id,
      plotId: t.plotId ?? null,
      overallHealthRating: t.overallHealthRating,
      phAnalysis: t.phAnalysis,
      nutrientDeficiencies: t.nutrientDeficiencies,
      organicAmendments: t.organicAmendments,
      fertilizerRegimen: t.fertilizerRegimen,
      irrigationAdvice: t.irrigationAdvice,
      createdAt: t.createdAt.toISOString(),
    })),
    total: Number(total),
    page,
    limit,
  });
});

router.get("/history/schedules", async (req, res): Promise<void> => {
  const params = ListSchedulesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();

  const conditions = [eq(advisorySchedulesTable.farmerId, farmer.id)];
  if (params.data.plotId) {
    conditions.push(eq(advisorySchedulesTable.plotId, params.data.plotId));
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const schedules = await db
    .select()
    .from(advisorySchedulesTable)
    .where(whereClause)
    .orderBy(desc(advisorySchedulesTable.createdAt));

  res.json(
    schedules.map((s) => ({
      id: s.id,
      plotId: s.plotId ?? null,
      cropType: s.cropType,
      startDate: s.startDate,
      expectedHarvestDate: s.expectedHarvestDate,
      weeklyTasks: s.scheduleTimeline,
      totalDays: Math.round(
        (new Date(s.expectedHarvestDate).getTime() - new Date(s.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      createdAt: s.createdAt.toISOString(),
    })),
  );
});

export default router;
