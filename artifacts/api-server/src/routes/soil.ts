import { Router, type IRouter } from "express";
import { db, soilTestsTable } from "@workspace/db";
import { AnalyzeSoilBody } from "@workspace/api-zod";
import { getAI, SYSTEM_PROMPT, SOIL_ANALYSIS_SCHEMA } from "../lib/gemini";
import { getOrCreateDefaultFarmer } from "../lib/farmer-context";

const router: IRouter = Router();

router.post("/soil/recommend", async (req, res): Promise<void> => {
  const parsed = AnalyzeSoilBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { phLevel, nitrogenPpm, phosphorusPpm, potassiumPpm, organicMatterPct, targetCrop, language, plotId } =
    parsed.data;

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

  const prompt = `Analyze the following soil test results for ${targetCrop} cultivation and provide precise fertilizer and soil correction recommendations.

Soil Parameters:
- pH Level: ${phLevel}
- Nitrogen (N): ${nitrogenPpm} kg/ha
- Phosphorus (P): ${phosphorusPpm} kg/ha
- Potassium (K): ${potassiumPpm} kg/ha
${organicMatterPct != null ? `- Organic Matter: ${organicMatterPct}%` : ""}
- Target Crop: ${targetCrop}
- Output language for localized content: ${lang}

Provide exact kg/hectare dosages for fertilizer recommendations. Include both organic and synthetic options.
Return a structured JSON response following the schema exactly.`;

  let aiResult: Record<string, unknown>;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: SOIL_ANALYSIS_SCHEMA,
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
    const msg = err instanceof Error ? err.message : "AI analysis failed";
    req.log.error({ err }, "Gemini API error");
    res.status(500).json({ error: msg });
    return;
  }

  type FertilizerStep = { stage: string; fertilizerName: string; dosageKgPerHa: number; applicationMethod: string };
  const [saved] = await db
    .insert(soilTestsTable)
    .values({
      plotId: plotId ?? null,
      farmerId: farmer.id,
      phLevel: String(phLevel),
      nitrogenPpm: String(nitrogenPpm),
      phosphorusPpm: String(phosphorusPpm),
      potassiumPpm: String(potassiumPpm),
      organicMatterPct: organicMatterPct != null ? String(organicMatterPct) : null,
      overallHealthRating: (aiResult.overallHealthRating as string) || "Imbalanced",
      phAnalysis: (aiResult.phAnalysis as string) || "",
      nutrientDeficiencies: (aiResult.nutrientDeficiencies as string[]) || [],
      organicAmendments: (aiResult.organicAmendments as string[]) || [],
      fertilizerRegimen: (aiResult.fertilizerRegimen as FertilizerStep[]) || [],
      irrigationAdvice: (aiResult.irrigationAdvice as string) || "",
      rawAiResponse: aiResult,
    })
    .returning();

  res.json({
    id: saved.id,
    plotId: saved.plotId ?? null,
    overallHealthRating: saved.overallHealthRating,
    phAnalysis: saved.phAnalysis,
    nutrientDeficiencies: saved.nutrientDeficiencies,
    organicAmendments: saved.organicAmendments,
    fertilizerRegimen: saved.fertilizerRegimen,
    irrigationAdvice: saved.irrigationAdvice,
    createdAt: saved.createdAt.toISOString(),
  });
});

export default router;
