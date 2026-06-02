import { describe, it, expect } from "vitest";
import { AnalysisSchema } from "./types";
import { SAMPLE_ANALYSIS } from "./sample-data";

describe("AnalysisSchema", () => {
  it("accepts the bundled sample analysis", () => {
    const r = AnalysisSchema.safeParse(SAMPLE_ANALYSIS);
    expect(r.success).toBe(true);
  });

  it("rejects a missing required field", () => {
    const bad = { ...SAMPLE_ANALYSIS } as Record<string, unknown>;
    delete bad.mandayMin;
    expect(AnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an out-of-range confidence", () => {
    const r = AnalysisSchema.safeParse({ ...SAMPLE_ANALYSIS, confidence: 150 });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid impact enum", () => {
    const bad = {
      ...SAMPLE_ANALYSIS,
      features: [{ ...SAMPLE_ANALYSIS.features[0], impact: "huge" }],
    };
    expect(AnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an invalid Thai risk level", () => {
    const bad = {
      ...SAMPLE_ANALYSIS,
      risks: [{ title: "x", level: "high", desc: "y" }],
    };
    expect(AnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it("coerces nothing — extra unknown keys are stripped, shape stays valid", () => {
    const r = AnalysisSchema.safeParse({ ...SAMPLE_ANALYSIS, _extra: 1 });
    expect(r.success).toBe(true);
    if (r.success) expect("_extra" in r.data).toBe(false);
  });
});
