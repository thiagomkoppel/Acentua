import { describe, expect, it } from "vitest";

import { expandAmbiguousDictionary } from "../../scripts/ambiguous-dictionary-expander.js";

describe("expandAmbiguousDictionary", () => {
  it("adds plain plus accented variants as ambiguous entries", () => {
    const result = expandAmbiguousDictionary(testInput());

    expect(result.addedEntries).toEqual({
      avo: ["avo", "avó", "avô"],
      esta: ["esta", "está"],
    });
  });

  it("merges additions into the sorted ambiguous dictionary", () => {
    const result = expandAmbiguousDictionary(testInput());

    expect(Object.keys(result.dictionary)).toEqual(["analise", "avo", "esta"]);
  });

  it("reports skipped candidates with reasons", () => {
    const result = expandAmbiguousDictionary(testInput());

    expect(reasonFor(result, "acao")).toBe("single-accented-option");
    expect(reasonFor(result, "analise")).toBe("already-ambiguous");
    expect(reasonFor(result, "facil")).toBe("safe-conflict");
    expect(reasonFor(result, "serie")).toBe("ignored-word");
  });

  it("rejects unsafe object keys generated from source text", () => {
    const result = expandAmbiguousDictionary({
      ...emptyInput(),
      sourceText: "prototype prótótype",
    });

    expect(result.addedEntries).toEqual({});
    expect(reasonFor(result, "prototype")).toBe("unsafe-key");
  });

  it("respects the configured minimum key length", () => {
    const result = expandAmbiguousDictionary({
      ...emptyInput(),
      minLength: 3,
      sourceText: "só só",
    });

    expect(result.candidateCount).toBe(0);
  });
});

function testInput() {
  return {
    ambiguousDictionary: { analise: ["analise", "análise"] },
    ignoredWords: ["serie"],
    minLength: 3,
    safeDictionary: { facil: "fácil" },
    sourceText:
      "esta está avó avô ação análise analise fácil facil série serie",
  };
}

function emptyInput() {
  return {
    ambiguousDictionary: {},
    ignoredWords: [],
    minLength: 3,
    safeDictionary: {},
  };
}

function reasonFor(result, key) {
  return result.skippedEntries.find((entry) => entry.key === key)?.reason;
}
