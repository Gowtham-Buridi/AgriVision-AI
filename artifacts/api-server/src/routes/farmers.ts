import { Router, type IRouter } from "express";
import { db, farmersTable } from "@workspace/db";
import { UpdateFarmerProfileBody } from "@workspace/api-zod";
import { getOrCreateDefaultFarmer } from "../lib/farmer-context";

const router: IRouter = Router();

router.get("/farmers/profile", async (req, res): Promise<void> => {
  const farmer = await getOrCreateDefaultFarmer();
  res.json({
    id: farmer.id,
    fullName: farmer.fullName,
    email: farmer.email,
    phoneNumber: farmer.phoneNumber ?? null,
    preferredLanguage: farmer.preferredLanguage,
    farmLocationName: farmer.farmLocationName ?? null,
    latitude: farmer.latitude ? parseFloat(farmer.latitude) : null,
    longitude: farmer.longitude ? parseFloat(farmer.longitude) : null,
    farmUnit: farmer.farmUnit,
    primaryCrops: farmer.primaryCrops ?? null,
    createdAt: farmer.createdAt.toISOString(),
  });
});

router.put("/farmers/profile", async (req, res): Promise<void> => {
  const parsed = UpdateFarmerProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();

  const [updated] = await db
    .update(farmersTable)
    .set({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phoneNumber: parsed.data.phoneNumber ?? farmer.phoneNumber,
      preferredLanguage: parsed.data.preferredLanguage ?? farmer.preferredLanguage,
      farmLocationName: parsed.data.farmLocationName ?? farmer.farmLocationName,
      latitude: parsed.data.latitude != null ? String(parsed.data.latitude) : farmer.latitude,
      longitude: parsed.data.longitude != null ? String(parsed.data.longitude) : farmer.longitude,
      farmUnit: parsed.data.farmUnit ?? farmer.farmUnit,
      primaryCrops: parsed.data.primaryCrops ?? farmer.primaryCrops,
    })
    .where(
      (await import("drizzle-orm")).eq(farmersTable.id, farmer.id),
    )
    .returning();

  res.json({
    id: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    phoneNumber: updated.phoneNumber ?? null,
    preferredLanguage: updated.preferredLanguage,
    farmLocationName: updated.farmLocationName ?? null,
    latitude: updated.latitude ? parseFloat(updated.latitude) : null,
    longitude: updated.longitude ? parseFloat(updated.longitude) : null,
    farmUnit: updated.farmUnit,
    primaryCrops: updated.primaryCrops ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
