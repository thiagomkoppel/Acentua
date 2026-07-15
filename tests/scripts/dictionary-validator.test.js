import { describe, expect, it } from "vitest";

import { validateDictionaries } from "../../scripts/dictionary-validator.js";

const validFiles = {
  ambiguous: entry(
    "src/dictionaries/pt-BR-ambiguous.json",
    '{"esta":["esta","está"]}',
    {
      esta: ["esta", "está"],
    },
  ),
  ignored: entry("src/dictionaries/ignored-words.json", '["api"]', ["api"]),
  safe: entry("src/dictionaries/pt-BR-safe.json", '{"tambem":"também"}', {
    tambem: "também",
  }),
};

describe("validateDictionaries", () => {
  it("accepts valid dictionary shapes", () => {
    expect(validateDictionaries(validFiles)).toMatchObject({ ok: true });
  });

  it("rejects duplicate JSON keys", () => {
    const files = withSafeRaw('{"tambem":"também","tambem":"também"}');

    expect(errorsFor(files)).toContain("tambem is duplicated");
  });

  it("rejects conflicts between safe and ambiguous dictionaries", () => {
    const files = withSafeData({ esta: "está" }, '{"esta":"está"}');

    expect(errorsFor(files)).toContain(
      "esta also exists in ambiguous dictionary",
    );
  });

  it("rejects unsafe dictionary keys", () => {
    const files = withSafeData(
      { constructor: "construtor" },
      '{"constructor":"construtor"}',
    );

    expect(errorsFor(files)).toContain("constructor is not allowed");
  });

  it("rejects unsorted safe keys", () => {
    const files = withSafeData(
      { voce: "você", tambem: "também" },
      '{"voce":"você","tambem":"também"}',
    );

    expect(errorsFor(files)).toContain("keys must be sorted alphabetically");
  });

  it("rejects ambiguous entries without the plain key", () => {
    const files = {
      ...validFiles,
      ambiguous: entry(
        "src/dictionaries/pt-BR-ambiguous.json",
        '{"pais":["país","pais"]}',
        {
          pais: ["país"],
        },
      ),
    };

    expect(errorsFor(files)).toContain(
      "pais options must include the plain key",
    );
  });
});

function entry(file, raw, data) {
  return { data, errors: [], file, raw };
}

function withSafeRaw(raw) {
  return withSafeData(JSON.parse(raw), raw);
}

function withSafeData(data, raw) {
  return {
    ...validFiles,
    safe: entry("src/dictionaries/pt-BR-safe.json", raw, data),
  };
}

function errorsFor(files) {
  return validateDictionaries(files).errors.join("\n");
}
