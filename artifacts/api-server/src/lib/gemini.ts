import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not configured. Please set it in your Replit Secrets.",
      );
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

export const SYSTEM_PROMPT =
  "You are Senior Dr. Aris Thorne, a world-class Agronomist, Plant Pathologist, and Soil Health Specialist with over 25 years of field experience in global tropical and temperate farming systems. Your job is to analyze plant visual symptoms, diagnose crop issues with scientific rigor, provide actionable, realistic, and eco-friendly farming advice, and deliver structured outputs adhering strictly to the required JSON Schema. Always prioritize sustainable, integrated pest management (IPM) alongside chemical interventions where critical. Adjust explanations to be understandable by a local farmer while preserving scientific accuracy.";

export const CROP_DIAGNOSIS_SCHEMA = {
  type: "object",
  properties: {
    cropName: { type: "string" },
    diseaseIdentified: { type: "string" },
    scientificName: { type: "string" },
    confidenceScore: {
      type: "number",
      description: "Percentage value between 0 and 100",
    },
    severityLevel: {
      type: "string",
      enum: ["Low", "Moderate", "Severe", "Critical"],
    },
    symptomsAnalysis: { type: "array", items: { type: "string" } },
    immediateAction: { type: "string" },
    organicTreatment: { type: "array", items: { type: "string" } },
    chemicalTreatment: { type: "array", items: { type: "string" } },
    preventiveMeasures: { type: "array", items: { type: "string" } },
    localizedNote: { type: "string" },
  },
  required: [
    "cropName",
    "diseaseIdentified",
    "confidenceScore",
    "severityLevel",
    "symptomsAnalysis",
    "immediateAction",
    "organicTreatment",
    "chemicalTreatment",
    "preventiveMeasures",
  ],
};

export const SOIL_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    overallHealthRating: {
      type: "string",
      enum: ["Optimal", "Deficient", "Toxic/Excess", "Imbalanced"],
    },
    phAnalysis: { type: "string" },
    nutrientDeficiencies: { type: "array", items: { type: "string" } },
    organicAmendments: { type: "array", items: { type: "string" } },
    fertilizerRegimen: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stage: { type: "string" },
          fertilizerName: { type: "string" },
          dosageKgPerHa: { type: "number" },
          applicationMethod: { type: "string" },
        },
        required: ["stage", "fertilizerName", "dosageKgPerHa", "applicationMethod"],
      },
    },
    irrigationAdvice: { type: "string" },
  },
  required: [
    "overallHealthRating",
    "phAnalysis",
    "nutrientDeficiencies",
    "organicAmendments",
    "fertilizerRegimen",
    "irrigationAdvice",
  ],
};

export const ADVISORY_SCHEDULE_SCHEMA = {
  type: "object",
  properties: {
    expectedHarvestDate: {
      type: "string",
      description: "ISO date string YYYY-MM-DD",
    },
    totalDays: { type: "number" },
    weeklyTasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          week: { type: "number" },
          startDate: { type: "string" },
          category: { type: "string" },
          tasks: { type: "array", items: { type: "string" } },
          notes: { type: "string" },
        },
        required: ["week", "startDate", "category", "tasks"],
      },
    },
  },
  required: ["expectedHarvestDate", "totalDays", "weeklyTasks"],
};

export const WEATHER_RISK_SCHEMA = {
  type: "object",
  properties: {
    overallRiskLevel: {
      type: "string",
      enum: ["Low", "Moderate", "High", "Critical"],
    },
    fungalRiskScore: { type: "number", description: "0-100" },
    insectRiskScore: { type: "number", description: "0-100" },
    pestRisks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pestName: { type: "string" },
          riskLevel: { type: "string" },
          description: { type: "string" },
        },
        required: ["pestName", "riskLevel", "description"],
      },
    },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "overallRiskLevel",
    "fungalRiskScore",
    "insectRiskScore",
    "pestRisks",
    "recommendations",
  ],
};
