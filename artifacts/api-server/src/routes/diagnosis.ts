import { Router, type IRouter } from "express";
import { db, cropDiagnosesTable } from "@workspace/db";
import { AnalyzeCropBody } from "@workspace/api-zod";
import { getAI, SYSTEM_PROMPT, CROP_DIAGNOSIS_SCHEMA } from "../lib/gemini";
import { getOrCreateDefaultFarmer } from "../lib/farmer-context";

const router: IRouter = Router();

router.post("/diagnosis/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeCropBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { cropName, imageBase64, imageMimeType, observedSymptoms, language, plotId } =
    parsed.data;

  // Validate image size (base64 of 10MB is ~13.6MB string)
  if (imageBase64.length > 14_000_000) {
    res.status(400).json({ error: "Image exceeds 10MB size limit" });
    return;
  }

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

  const prompt = `Analyze this crop image and provide a detailed disease diagnosis.
Crop name: ${cropName}
${observedSymptoms ? `Observed symptoms: ${observedSymptoms}` : ""}
Language for localized advice: ${lang}

Provide your analysis in English with the localizedNote field translated to ${lang}.
Return a structured JSON response following the schema exactly.`;

  let aiResult: Record<string, unknown>;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: imageMimeType as "image/jpeg" | "image/png" | "image/webp",
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: CROP_DIAGNOSIS_SCHEMA,
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

  // Store in database
  const imageRef = `diagnosis-${Date.now()}`;
  const [saved] = await db
    .insert(cropDiagnosesTable)
    .values({
      plotId: plotId ?? null,
      farmerId: farmer.id,
      imageUrl: imageRef,
      cropName: (aiResult.cropName as string) || cropName,
      diseaseIdentified: (aiResult.diseaseIdentified as string) || "Unknown",
      scientificName: (aiResult.scientificName as string) || null,
      confidenceScore: String(aiResult.confidenceScore as number),
      severityLevel: (aiResult.severityLevel as string) || "Low",
      symptomsAnalysis: (aiResult.symptomsAnalysis as string[]) || [],
      immediateAction: (aiResult.immediateAction as string) || "",
      organicTreatment: (aiResult.organicTreatment as string[]) || [],
      chemicalTreatment: (aiResult.chemicalTreatment as string[]) || [],
      preventiveMeasures: (aiResult.preventiveMeasures as string[]) || [],
      localizedNote: (aiResult.localizedNote as string) || null,
      rawAiResponse: aiResult,
    })
    .returning();

  res.json({
    id: saved.id,
    plotId: saved.plotId ?? null,
    cropName: saved.cropName,
    diseaseIdentified: saved.diseaseIdentified,
    scientificName: saved.scientificName ?? null,
    confidenceScore: parseFloat(saved.confidenceScore),
    severityLevel: saved.severityLevel,
    symptomsAnalysis: saved.symptomsAnalysis,
    immediateAction: saved.immediateAction,
    organicTreatment: saved.organicTreatment,
    chemicalTreatment: saved.chemicalTreatment,
    preventiveMeasures: saved.preventiveMeasures,
    localizedNote: saved.localizedNote ?? null,
    imageUrl: saved.imageUrl,
    createdAt: saved.createdAt.toISOString(),
  });
});

export default router;
