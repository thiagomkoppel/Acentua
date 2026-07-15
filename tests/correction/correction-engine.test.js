import { describe, expect, it } from "vitest";

import { correctWord } from "../../src/correction/correction-engine.js";

const dictionaries = {
  ambiguousDictionary: { esta: ["esta", "está"] },
  customDictionary: {},
  ignoredWords: [],
  safeDictionary: { tambem: "também", voce: "você" },
};

describe("correctWord", () => {
  it("corrects a safe dictionary word", () => {
    expect(correctWord("tambem", dictionaries)).toMatchObject({
      changed: true,
      corrected: "também",
      reason: "safe-dictionary",
    });
  });

  it("leaves unknown words unchanged", () => {
    expect(correctWord("banana", dictionaries)).toMatchObject({
      changed: false,
      reason: "unknown-word",
    });
  });

  it("leaves ambiguous words unchanged", () => {
    expect(correctWord("esta", dictionaries)).toMatchObject({
      changed: false,
      reason: "ambiguous-word",
    });
  });

  it("preserves capitalization through the engine", () => {
    expect(correctWord("VOCE", dictionaries).corrected).toBe("VOCÊ");
  });

  it("normalizes unicode before lookup", () => {
    expect(correctWord("voce\u0301", dictionaries).changed).toBe(false);
  });

  it("honors ignored words before custom entries", () => {
    const result = correctWord("tambem", {
      ...dictionaries,
      customDictionary: { tambem: "também" },
      ignoredWords: ["tambem"],
    });

    expect(result.reason).toBe("ignored-word");
  });

  it("lets custom entries override ambiguous words", () => {
    const result = correctWord("esta", {
      ...dictionaries,
      customDictionary: { esta: "está" },
    });

    expect(result).toMatchObject({
      changed: true,
      reason: "custom-dictionary",
    });
  });
});
