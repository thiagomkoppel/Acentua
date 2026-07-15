import { describe, expect, it } from "vitest";

import { correctWord } from "../../src/correction/correction-engine.js";

const dictionaries = {
  ambiguousDictionary: { esta: ["esta", "est\u00e1"] },
  customDictionary: {},
  ignoredWords: [],
  safeDictionary: { tambem: "tamb\u00e9m", voce: "voc\u00ea" },
};

describe("correctWord", () => {
  it("corrects a safe dictionary word", () => {
    expect(correctWord("tambem", dictionaries)).toMatchObject({
      changed: true,
      corrected: "tamb\u00e9m",
      reason: "safe-dictionary",
    });
  });

  it("leaves unknown words unchanged", () => {
    expect(correctWord("banana", dictionaries)).toMatchObject({
      changed: false,
      reason: "unknown-word",
    });
  });

  it("leaves ambiguous words unchanged with suggestions", () => {
    expect(correctWord("esta", dictionaries)).toMatchObject({
      changed: false,
      reason: "ambiguous-word",
      suggestions: ["est\u00e1"],
    });
  });

  it("preserves capitalization in ambiguous suggestions", () => {
    expect(correctWord("ESTA", dictionaries).suggestions).toEqual([
      "EST\u00c1",
    ]);
  });

  it("preserves capitalization through the engine", () => {
    expect(correctWord("VOCE", dictionaries).corrected).toBe("VOC\u00ca");
  });

  it("normalizes unicode before lookup", () => {
    expect(correctWord("voce\u0301", dictionaries).changed).toBe(false);
  });

  it("honors ignored words before custom entries", () => {
    const result = correctWord("tambem", {
      ...dictionaries,
      customDictionary: { tambem: "tamb\u00e9m" },
      ignoredWords: ["tambem"],
    });

    expect(result.reason).toBe("ignored-word");
  });

  it("lets custom entries override ambiguous words", () => {
    const result = correctWord("esta", {
      ...dictionaries,
      customDictionary: { esta: "est\u00e1" },
    });

    expect(result).toMatchObject({
      changed: true,
      reason: "custom-dictionary",
    });
  });
});
