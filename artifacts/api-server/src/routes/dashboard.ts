import { Router, type IRouter } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import {
  db,
  cropDiagnosesTable,
  soilTestsTable,
  advisorySchedulesTable,
  fieldPlotsTable,
} from "@workspace/db";
import { getOrCreateDefaultFarmer } from "../lib/farmer-context";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const farmer = await getOrCreateDefaultFarmer();
  const fid = farmer.id;

  const [
    [{ totalPlots }],
    [{ totalDiagnoses }],
    [{ totalSoilTests }],
    [{ totalSchedules }],
    recentDiagnoses,
    severityRows,
    cropRows,
  ] = await Promise.all([
    db
      .select({ totalPlots: count() })
      .from(fieldPlotsTable)
      .where(eq(fieldPlotsTable.farmerId, fid)),
    db
      .select({ totalDiagnoses: count() })
      .from(cropDiagnosesTable)
      .where(eq(cropDiagnosesTable.farmerId, fid)),
    db
      .select({ totalSoilTests: count() })
      .from(soilTestsTable)
      .where(eq(soilTestsTable.farmerId, fid)),
    db
      .select({ totalSchedules: count() })
      .from(advisorySchedulesTable)
      .where(eq(advisorySchedulesTable.farmerId, fid)),
    db
      .select({
        id: cropDiagnosesTable.id,
        cropName: cropDiagnosesTable.cropName,
        diseaseIdentified: cropDiagnosesTable.diseaseIdentified,
        severityLevel: cropDiagnosesTable.severityLevel,
        confidenceScore: cropDiagnosesTable.confidenceScore,
        createdAt: cropDiagnosesTable.createdAt,
      })
      .from(cropDiagnosesTable)
      .where(eq(cropDiagnosesTable.farmerId, fid))
      .orderBy(desc(cropDiagnosesTable.createdAt))
      .limit(5),
    db
      .select({
        severityLevel: cropDiagnosesTable.severityLevel,
        cnt: count(),
      })
      .from(cropDiagnosesTable)
      .where(eq(cropDiagnosesTable.farmerId, fid))
      .groupBy(cropDiagnosesTable.severityLevel),
    db
      .select({
        crop: cropDiagnosesTable.cropName,
        cnt: count(),
      })
      .from(cropDiagnosesTable)
      .where(eq(cropDiagnosesTable.farmerId, fid))
      .groupBy(cropDiagnosesTable.cropName)
      .orderBy(sql`count(*) desc`)
      .limit(8),
  ]);

  const severityBreakdown = { Low: 0, Moderate: 0, Severe: 0, Critical: 0 };
  for (const row of severityRows) {
    const key = row.severityLevel as keyof typeof severityBreakdown;
    if (key in severityBreakdown) {
      severityBreakdown[key] = Number(row.cnt);
    }
  }

  res.json({
    totalPlots: Number(totalPlots),
    totalDiagnoses: Number(totalDiagnoses),
    totalSoilTests: Number(totalSoilTests),
    totalSchedules: Number(totalSchedules),
    recentDiagnoses: recentDiagnoses.map((d) => ({
      id: d.id,
      cropName: d.cropName,
      diseaseIdentified: d.diseaseIdentified,
      severityLevel: d.severityLevel,
      confidenceScore: parseFloat(d.confidenceScore),
      plotName: null,
      createdAt: d.createdAt.toISOString(),
    })),
    severityBreakdown,
    cropDistribution: cropRows.map((r) => ({
      crop: r.crop,
      count: Number(r.cnt),
    })),
  });
});

export default router;
