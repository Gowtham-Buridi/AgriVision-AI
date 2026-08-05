import { Router, type IRouter } from "express";
import { GetWeatherRiskQueryParams } from "@workspace/api-zod";
import { getAI, SYSTEM_PROMPT, WEATHER_RISK_SCHEMA } from "../lib/gemini";

const router: IRouter = Router();

router.get("/weather/risk", async (req, res): Promise<void> => {
  const params = GetWeatherRiskQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { latitude, longitude, cropType } = params.data;

  // Generate realistic simulated weather data based on location or use defaults
  // In production this would integrate with OpenWeatherMap or similar
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const isNorthernHemisphere = (latitude ?? 20) > 0;
  const isSummer = isNorthernHemisphere ? month >= 5 && month <= 8 : month <= 2 || month >= 11;

  const baseTemp = isNorthernHemisphere
    ? isSummer
      ? 28 + Math.random() * 8
      : 15 + Math.random() * 8
    : isSummer
      ? 30 + Math.random() * 6
      : 18 + Math.random() * 6;

  const humidity = 55 + Math.random() * 35; // 55-90%
  const rainfall = Math.random() > 0.6 ? Math.random() * 25 : 0; // sporadic rainfall

  let ai;
  try {
    ai = getAI();
  } catch {
    // Return basic weather without AI analysis if key not configured
    res.json({
      temperature: parseFloat(baseTemp.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1)),
      rainfall: parseFloat(rainfall.toFixed(1)),
      overallRiskLevel: "Low",
      pestRisks: [],
      fungalRiskScore: 0,
      insectRiskScore: 0,
      recommendations: ["Set up GEMINI_API_KEY to receive AI-powered pest risk forecasts."],
      generatedAt: now.toISOString(),
    });
    return;
  }

  const prompt = `Based on the following weather conditions, analyze pest and disease risks for ${cropType || "general crops"} and provide an AI-driven forecast.

Current Weather Data:
- Temperature: ${baseTemp.toFixed(1)}°C
- Humidity: ${humidity.toFixed(1)}%
- Recent Rainfall: ${rainfall.toFixed(1)}mm
- Location: ${latitude && longitude ? `${latitude}°N, ${longitude}°E` : "Tropical/subtropical region"}
- Season: ${isSummer ? "Summer/Wet" : "Winter/Dry"}
- Crop Type: ${cropType || "mixed crops"}

Assess fungal disease risk (0-100), insect infestation risk (0-100), identify likely pests, and provide prevention recommendations.
Return structured JSON following the schema exactly.`;

  let aiResult: Record<string, unknown>;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: WEATHER_RISK_SCHEMA,
        maxOutputTokens: 4096,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty AI response");
    }
    aiResult = JSON.parse(text) as Record<string, unknown>;
  } catch (err: unknown) {
    req.log.error({ err }, "Weather AI error");
    // Fall back to basic response
    res.json({
      temperature: parseFloat(baseTemp.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1)),
      rainfall: parseFloat(rainfall.toFixed(1)),
      overallRiskLevel: humidity > 80 ? "Moderate" : "Low",
      pestRisks: [],
      fungalRiskScore: humidity > 80 ? 60 : 20,
      insectRiskScore: baseTemp > 28 ? 50 : 25,
      recommendations: ["Monitor crops regularly for early signs of disease or pest damage."],
      generatedAt: now.toISOString(),
    });
    return;
  }

  type PestRisk = { pestName: string; riskLevel: string; description: string };
  res.json({
    temperature: parseFloat(baseTemp.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    rainfall: parseFloat(rainfall.toFixed(1)),
    overallRiskLevel: (aiResult.overallRiskLevel as string) || "Low",
    pestRisks: (aiResult.pestRisks as PestRisk[]) || [],
    fungalRiskScore: (aiResult.fungalRiskScore as number) || 0,
    insectRiskScore: (aiResult.insectRiskScore as number) || 0,
    recommendations: (aiResult.recommendations as string[]) || [],
    generatedAt: now.toISOString(),
  });
});

export default router;
