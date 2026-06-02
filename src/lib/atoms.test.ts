import { describe, it, expect } from "vitest";
import { maskApiKey } from "./atoms";

describe("maskApiKey", () => {
  it("masks a normal key keeping head + tail", () => {
    expect(maskApiKey("sk-proj-abcdef123456WXYZ")).toBe("sk-pr…WXYZ");
  });

  it("hides short values entirely", () => {
    expect(maskApiKey("short")).toBe("••••");
  });

  it("trims whitespace before masking", () => {
    expect(maskApiKey("  sk-1234567890abcd  ")).toBe("sk-12…abcd");
  });
});
