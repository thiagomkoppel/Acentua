import { describe, expect, it } from "vitest";

import { expandSafeDictionary } from "../../scripts/safe-dictionary-expander.js";

describe("expandSafeDictionary", () => {
  it("adds one-to-one accented candidates from source text", () => {
    const result = expandSafeDictionary(testInput());

    expect(result.addedEntries).toEqual({ acao: "ação", servico: "serviço" });
    expect(result.safeDictionary).toMatchObject({
      acao: "ação",
      facil: "fácil",
      servico: "serviço",
    });
  });

  it("reports skipped candidates with reasons", () => {
    const result = expandSafeDictionary(testInput());

    expect(reasonFor(result, "facil")).toBe("already-safe");
    expect(reasonFor(result, "esta")).toBe("ambiguous-dictionary");
    expect(reasonFor(result, "serie")).toBe("ignored-word");
    expect(reasonFor(result, "avo")).toBe("multiple-accented-options");
  });

  it("rejects unsafe object keys generated from source text", () => {
    const result = expandSafeDictionary({
      ...emptyInput(),
      sourceText: "prótótype",
    });

    expect(result.addedEntries).toEqual({});
    expect(reasonFor(result, "prototype")).toBe("unsafe-key");
  });

  it("respects the configured minimum key length", () => {
    const result = expandSafeDictionary({
      ...emptyInput(),
      minLength: 3,
      sourceText: "só",
    });

    expect(result.candidateCount).toBe(0);
  });
});

function testInput() {
  return {
    ambiguousDictionary: { esta: ["esta", "está"] },
    ignoredWords: ["serie"],
    minLength: 3,
    safeDictionary: { facil: "fácil" },
    sourceText: "Serviço fácil está série avó avô ação",
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
