import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, fieldPlotsTable } from "@workspace/db";
import {
  CreatePlotBody,
  UpdatePlotBody,
  GetPlotParams,
  UpdatePlotParams,
  DeletePlotParams,
} from "@workspace/api-zod";
import { getOrCreateDefaultFarmer } from "../lib/farmer-context";

const router: IRouter = Router();

router.get("/plots", async (req, res): Promise<void> => {
  const farmer = await getOrCreateDefaultFarmer();
  const plots = await db
    .select()
    .from(fieldPlotsTable)
    .where(eq(fieldPlotsTable.farmerId, farmer.id))
    .orderBy(fieldPlotsTable.createdAt);

  res.json(
    plots.map((p) => ({
      id: p.id,
      farmerId: p.farmerId,
      plotName: p.plotName,
      areaHectares: parseFloat(p.areaHectares),
      soilType: p.soilType,
      currentCrop: p.currentCrop ?? null,
      plantingDate: p.plantingDate ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

router.post("/plots", async (req, res): Promise<void> => {
  const parsed = CreatePlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();

  const [plot] = await db
    .insert(fieldPlotsTable)
    .values({
      farmerId: farmer.id,
      plotName: parsed.data.plotName,
      areaHectares: String(parsed.data.areaHectares),
      soilType: parsed.data.soilType,
      currentCrop: parsed.data.currentCrop,
      plantingDate: parsed.data.plantingDate ?? null,
    })
    .returning();

  res.status(201).json({
    id: plot.id,
    farmerId: plot.farmerId,
    plotName: plot.plotName,
    areaHectares: parseFloat(plot.areaHectares),
    soilType: plot.soilType,
    currentCrop: plot.currentCrop ?? null,
    plantingDate: plot.plantingDate ?? null,
    createdAt: plot.createdAt.toISOString(),
  });
});

router.get("/plots/:id", async (req, res): Promise<void> => {
  const params = GetPlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();
  const [plot] = await db
    .select()
    .from(fieldPlotsTable)
    .where(eq(fieldPlotsTable.id, params.data.id));

  if (!plot || plot.farmerId !== farmer.id) {
    res.status(404).json({ error: "Plot not found" });
    return;
  }

  res.json({
    id: plot.id,
    farmerId: plot.farmerId,
    plotName: plot.plotName,
    areaHectares: parseFloat(plot.areaHectares),
    soilType: plot.soilType,
    currentCrop: plot.currentCrop ?? null,
    plantingDate: plot.plantingDate ?? null,
    createdAt: plot.createdAt.toISOString(),
  });
});

router.patch("/plots/:id", async (req, res): Promise<void> => {
  const params = UpdatePlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();
  const [existing] = await db
    .select()
    .from(fieldPlotsTable)
    .where(eq(fieldPlotsTable.id, params.data.id));

  if (!existing || existing.farmerId !== farmer.id) {
    res.status(404).json({ error: "Plot not found" });
    return;
  }

  const updateData: Partial<typeof fieldPlotsTable.$inferInsert> = {};
  if (parsed.data.plotName != null) updateData.plotName = parsed.data.plotName;
  if (parsed.data.areaHectares != null)
    updateData.areaHectares = String(parsed.data.areaHectares);
  if (parsed.data.soilType != null) updateData.soilType = parsed.data.soilType;
  if (parsed.data.currentCrop != null) updateData.currentCrop = parsed.data.currentCrop;
  if (parsed.data.plantingDate != null) updateData.plantingDate = parsed.data.plantingDate;

  const [updated] = await db
    .update(fieldPlotsTable)
    .set(updateData)
    .where(eq(fieldPlotsTable.id, params.data.id))
    .returning();

  res.json({
    id: updated.id,
    farmerId: updated.farmerId,
    plotName: updated.plotName,
    areaHectares: parseFloat(updated.areaHectares),
    soilType: updated.soilType,
    currentCrop: updated.currentCrop ?? null,
    plantingDate: updated.plantingDate ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/plots/:id", async (req, res): Promise<void> => {
  const params = DeletePlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();
  const [existing] = await db
    .select()
    .from(fieldPlotsTable)
    .where(eq(fieldPlotsTable.id, params.data.id));

  if (!existing || existing.farmerId !== farmer.id) {
    res.status(404).json({ error: "Plot not found" });
    return;
  }

  await db.delete(fieldPlotsTable).where(eq(fieldPlotsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
