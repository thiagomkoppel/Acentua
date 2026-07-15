// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { inputAdapter } from "../../src/content/input-adapter.js";

describe("inputAdapter", () => {
  beforeEach(() => {
    document.body.textContent = "";
  });

  it("supports normal text inputs", () => {
    const input = document.createElement("input");

    input.type = "text";

    expect(inputAdapter.isSupported(input)).toBe(true);
  });

  it("supports textareas", () => {
    expect(inputAdapter.isSupported(document.createElement("textarea"))).toBe(
      true,
    );
  });

  it("rejects password fields", () => {
    const input = document.createElement("input");

    input.type = "password";

    expect(inputAdapter.isSupported(input)).toBe(false);
  });

  it("rejects fields inside code elements", () => {
    const code = document.createElement("code");
    const input = document.createElement("textarea");

    code.append(input);
    document.body.append(code);

    expect(inputAdapter.isSupported(input)).toBe(false);
  });

  it("replaces a range and preserves the requested cursor", () => {
    const input = document.createElement("textarea");

    input.value = "tambem ";
    input.setSelectionRange(7, 7);
    inputAdapter.replaceRange(input, 0, 6, "também", 7);

    expect(input.value).toBe("também ");
    expect(input.selectionStart).toBe(7);
  });
});
