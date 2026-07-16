import { describe, expect, it } from "vitest";

import {
  getCompletedToken,
  getTokenBeforeCursor,
} from "../../src/correction/tokenizer.js";

describe("getCompletedToken", () => {
  it("finds a word before a space", () => {
    expect(getCompletedToken("Eu tambem ", 10)).toMatchObject({
      delimiter: " ",
      end: 9,
      start: 3,
      word: "tambem",
    });
  });

  it("finds a word before punctuation", () => {
    expect(getCompletedToken("tambem,", 7)).toMatchObject({
      delimiter: ",",
      word: "tambem",
    });
  });

  it("returns null for repeated spaces", () => {
    expect(getCompletedToken("tambem  ", 8)).toBeNull();
  });
  it("finds a pending word before a completion key", () => {
    expect(getTokenBeforeCursor("servico", 7, "Tab")).toMatchObject({
      delimiter: "Tab",
      end: 7,
      start: 0,
      word: "servico",
    });
  });

  it("returns null when pending cursor is after whitespace", () => {
    expect(getTokenBeforeCursor("servico ", 8, "Tab")).toBeNull();
  });

  it("does not split hyphenated words", () => {
    expect(getCompletedToken("anti-tambem ", 12)).toBeNull();
  });

  it("does not split apostrophe words", () => {
    expect(getCompletedToken("d'tambem ", 9)).toBeNull();
  });

  it("skips likely email addresses", () => {
    expect(getCompletedToken("eu@tambem ", 10)).toBeNull();
  });

  it("skips likely urls", () => {
    expect(getCompletedToken("https://tambem ", 15)).toBeNull();
  });
});
