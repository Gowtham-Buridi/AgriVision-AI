import { Router, type IRouter } from "express";
import { db, advisorySchedulesTable } from "@workspace/db";
import { GenerateAdvisoryBody } from "@workspace/api-zod";
import { getAI, SYSTEM_PROMPT, ADVISORY_SCHEDULE_SCHEMA } from "../lib/gemini";
import { getOrCreateDefaultFarmer } from "../lib/farmer-context";

const router: IRouter = Router();

router.post("/advisory/schedule", async (req, res): Promise<void> => {
  const parsed = GenerateAdvisoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { cropType, startDate, regionName, soilType, language, plotId } = parsed.data;

  let ai;
  try {
    ai = getAI();
  } catch {
    res.status(503).json({
      error: "AI service not configured. Please set GEMINI_API_KEY in your environment secrets.",
    });
    return;
  }

  const farmer = await getOrCreateDefaultFarmer();
  const lang = language ?? "en";

  const prompt = `Generate a complete 90-180 day seasonal crop advisory schedule for the following:

Crop Type: ${cropType}
Planting Start Date: ${startDate}
Region/Location: ${regionName}
${soilType ? `Soil Type: ${soilType}` : ""}
Output Language: ${lang}

Create a week-by-week action plan covering all critical agricultural phases:
- Land preparation and soil conditioning
- Seed selection, treatment, and sowing
- Germination and early growth monitoring
- Fertilization and nutrient management (fertigation)
- Irrigation scheduling
- Pest and disease surveillance
- Pruning, thinning, or training (if applicable)
- Pre-harvest preparation
- Harvest timing and post-harvest handling

Each week should have a clear category (e.g., "Soil Prep", "Sowing", "Fertilization", "Pest Control", "Irrigation", "Monitoring", "Harvest").
Provide realistic expected harvest date based on crop growth cycle.
Return a structured JSON response following the schema exactly.`;

  let aiResult: Record<string, unknown>;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: ADVISORY_SCHEDULE_SCHEMA,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text;
    if (!text) {
      res.status(500).json({ error: "AI returned empty response" });
      return;
    }
    aiResult = JSON.parse(text) as Record<string, unknown>;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI schedule generation failed";
    req.log.error({ err }, "Gemini API error");
    res.status(500).json({ error: msg });
    return;
  }

  type WeeklyTask = { week: number; startDate: string; tasks: string[]; category: string; notes?: string };
  const weeklyTasks = (aiResult.weeklyTasks as WeeklyTask[]) || [];
  const expectedHarvestDate = (aiResult.expectedHarvestDate as string) || startDate;
  const totalDays = (aiResult.totalDays as number) || 90;

  const [saved] = await db
    .insert(advisorySchedulesTable)
    .values({
      plotId: plotId ?? null,
      farmerId: farmer.id,
      cropType,
      startDate,
      expectedHarvestDate,
      scheduleTimeline: weeklyTasks,
    })
    .returning();

  res.json({
    id: saved.id,
    plotId: saved.plotId ?? null,
    cropType: saved.cropType,
    startDate: saved.startDate,
    expectedHarvestDate: saved.expectedHarvestDate,
    weeklyTasks: saved.scheduleTimeline,
    totalDays,
    createdAt: saved.createdAt.toISOString(),
  });
});

export default router;
