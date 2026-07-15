import { describe, expect, it } from "vitest";

import { applyCapitalization } from "../../src/correction/capitalization.js";

describe("applyCapitalization", () => {
  it("keeps lowercase corrections lowercase", () => {
    expect(applyCapitalization("voce", "você")).toBe("você");
  });

  it("preserves title case", () => {
    expect(applyCapitalization("Voce", "você")).toBe("Você");
  });

  it("preserves uppercase", () => {
    expect(applyCapitalization("VOCE", "você")).toBe("VOCÊ");
  });

  it("uses the dictionary casing for mixed case input", () => {
    expect(applyCapitalization("vOcE", "você")).toBe("você");
  });
});
