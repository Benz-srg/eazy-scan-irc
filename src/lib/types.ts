import { z } from "zod";

export const ImpactSchema = z.enum(["high", "medium", "low"]);
export const RiskLevelSchema = z.enum(["สูง", "กลาง", "ต่ำ"]);

export const FeatureSchema = z.object({
  name: z.string(),
  en: z.string(),
  icon: z.string(),
  desc: z.string(),
  est: z.string(),
  impact: ImpactSchema,
});

export const MandayRowSchema = z.object({
  module: z.string(),
  min: z.number(),
  max: z.number(),
  note: z.string(),
});

export const RiskSchema = z.object({
  title: z.string(),
  level: RiskLevelSchema,
  desc: z.string(),
});

export const MissingSchema = z.object({
  q: z.string(),
  why: z.string(),
});

export const DependencySchema = z.object({
  name: z.string(),
  note: z.string(),
  icon: z.string(),
});

export const IntegrationSchema = z.object({
  name: z.string(),
  cat: z.string(),
  icon: z.string(),
});

export const SummarySchema = z.object({
  overview: z.string(),
  goals: z.array(z.string()),
  scale: z.string(),
  timeline: z.string(),
});

/** Strict LLM output contract. Every analysis must carry confidence + transcript evidence. */
export const AnalysisSchema = z.object({
  client: z.string(),
  title: z.string(),
  confidence: z.number().min(0).max(100),
  evidence: z.string().describe("ข้อความจาก transcript ที่ใช้อ้างอิงผลวิเคราะห์"),
  mandayMin: z.number(),
  mandayMax: z.number(),
  summary: SummarySchema,
  features: z.array(FeatureSchema),
  manday: z.array(MandayRowSchema),
  risks: z.array(RiskSchema),
  assumptions: z.array(z.string()),
  missing: z.array(MissingSchema),
  questions: z.array(z.string()),
  dependencies: z.array(DependencySchema),
  integrations: z.array(IntegrationSchema),
});

export type Impact = z.infer<typeof ImpactSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type MandayRow = z.infer<typeof MandayRowSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Missing = z.infer<typeof MissingSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
export type Integration = z.infer<typeof IntegrationSchema>;
export type Summary = z.infer<typeof SummarySchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;

export type JobStatus = "processing" | "done" | "error";

export type HistoryItem = {
  id: string;
  title: string;
  client: string;
  audio: string;
  audioUrl?: string;
  date: string;
  mandayMin: number;
  mandayMax: number;
  features: number;
  tag: string;
  status?: JobStatus;
};
