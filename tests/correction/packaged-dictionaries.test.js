import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { correctWord } from "../../src/correction/correction-engine.js";
import { validateDictionaryFiles } from "../../scripts/dictionary-validator.js";

const safeDictionary = readJson("src/dictionaries/pt-BR-safe.json");
const ambiguousDictionary = readJson("src/dictionaries/pt-BR-ambiguous.json");
const dictionaries = {
  ambiguousDictionary,
  customDictionary: {},
  ignoredWords: [],
  safeDictionary,
};

describe("packaged dictionaries", () => {
  it("passes dictionary validation", async () => {
    await expect(validateDictionaryFiles()).resolves.toMatchObject({
      ok: true,
    });
  });

  it("contains the expanded safe vocabulary", () => {
    expect(Object.keys(safeDictionary)).toHaveLength(326);
  });

  it.each([
    ["acao", "ação"],
    ["alguem", "alguém"],
    ["basico", "básico"],
    ["coracao", "coração"],
    ["familia", "família"],
    ["proximo", "próximo"],
    ["saude", "saúde"],
    ["servico", "serviço"],
  ])("corrects packaged safe word %s", (plain, accented) => {
    expect(correctWord(plain, dictionaries).corrected).toBe(accented);
  });

  it.each(["inicio", "numero", "pais", "publico"])(
    "blocks packaged ambiguous word %s",
    (word) => {
      expect(correctWord(word, dictionaries)).toMatchObject({
        changed: false,
        reason: "ambiguous-word",
      });
    },
  );
});

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}
