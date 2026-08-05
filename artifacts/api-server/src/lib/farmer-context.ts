import { db, farmersTable } from "@workspace/db";

const DEFAULT_FARMER_EMAIL = "demo@agrivision.ai";
const DEFAULT_FARMER_NAME = "Demo Farmer";

/**
 * Gets the first farmer in the database, or creates a default demo farmer.
 * This provides a simple single-user context without requiring full authentication.
 */
export async function getOrCreateDefaultFarmer() {
  const [existing] = await db.select().from(farmersTable).limit(1);
  if (existing) return existing;

  const [newFarmer] = await db
    .insert(farmersTable)
    .values({
      fullName: DEFAULT_FARMER_NAME,
      email: DEFAULT_FARMER_EMAIL,
      preferredLanguage: "en",
      farmUnit: "hectares",
    })
    .returning();

  return newFarmer;
}
