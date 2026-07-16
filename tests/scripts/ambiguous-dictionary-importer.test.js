import { describe, expect, it } from "vitest";

import { importAmbiguousDictionary } from "../../scripts/ambiguous-dictionary-importer.js";

describe("importAmbiguousDictionary", () => {
  it("imports new ambiguous entries from a JSON dictionary", () => {
    const result = importAmbiguousDictionary(testInput());

    expect(result.addedEntries).toEqual({
      a: ["a", "à"],
      avo: ["avo", "avó", "avô"],
      so: ["so", "só"],
    });
    expect(result.ambiguousDictionary.avo).toEqual(["avo", "avó", "avô"]);
  });

  it("skips safe conflicts by default", () => {
    const result = importAmbiguousDictionary(testInput());

    expect(result.addedEntries.agencia).toBeUndefined();
    expect(reasonFor(result, "agencia")).toBe("safe-conflict");
  });

  it("moves safe conflicts when explicitly requested", () => {
    const result = importAmbiguousDictionary({
      ...testInput(),
      moveSafeConflicts: true,
    });

    expect(result.addedEntries.agencia).toEqual(["agencia", "agência"]);
    expect(result.safeDictionary.agencia).toBeUndefined();
    expect(result.movedSafeCount).toBe(1);
  });

  it("reports skipped source entries", () => {
    const result = importAmbiguousDictionary(testInput());

    expect(reasonFor(result, "analise")).toBe("already-ambiguous");
    expect(reasonFor(result, "serie")).toBe("ignored-word");
    expect(reasonFor(result, "ruim")).toBe("invalid-entry");
  });

  it("supports a minimum key length for short noisy words", () => {
    const result = importAmbiguousDictionary({
      ...testInput(),
      minLength: 3,
    });

    expect(reasonFor(result, "a")).toBe("invalid-entry");
  });
});

function testInput() {
  return {
    ambiguousDictionary: { analise: ["analise", "análise"] },
    ignoredWords: ["serie"],
    minLength: 1,
    moveSafeConflicts: false,
    safeDictionary: { agencia: "agência" },
    sourceDictionary: {
      a: ["a", "à"],
      agencia: ["agencia", "agência"],
      analise: ["analise", "análise"],
      avo: ["avo", "avó", "avô"],
      serie: ["serie", "série"],
      ruim: ["ruim"],
      so: ["só"],
    },
  };
}

function reasonFor(result, key) {
  return result.skippedEntries.find((entry) => entry.key === key)?.reason;
}
