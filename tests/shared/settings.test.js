import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  isEnabledForDomain,
  mergeSettings,
  parseShortcutKey,
} from "../../src/shared/settings.js";

describe("settings", () => {
  it("defaults to enabled", () => {
    expect(mergeSettings({}).enabled).toBe(true);
  });

  it("defaults ambiguous suggestions to enabled", () => {
    expect(mergeSettings({}).showAmbiguousSuggestions).toBe(true);
  });

  it("defaults ambiguous suggestion shortcuts", () => {
    expect(mergeSettings({}).shortcutKeys).toEqual(
      DEFAULT_SETTINGS.shortcutKeys,
    );
  });

  it("parses shortcut labels to stored keys", () => {
    expect(parseShortcutKey("Ctrl+]")).toBe("]");
    expect(parseShortcutKey("Cmd+[")).toBe("[");
  });

  it("falls back for invalid shortcut labels", () => {
    expect(parseShortcutKey("Ctrl+Enter", ".")).toBe(".");
  });

  it("does not allow duplicate suggestion shortcuts", () => {
    const settings = mergeSettings({
      shortcutKeys: { acceptSuggestion: "]", dismissSuggestion: "]" },
    });

    expect(settings.shortcutKeys).toEqual({
      acceptSuggestion: "]",
      dismissSuggestion: ",",
    });
  });

  it("respects ambiguous suggestion disable", () => {
    expect(mergeSettings({ showAmbiguousSuggestions: false })).toMatchObject({
      showAmbiguousSuggestions: false,
    });
  });

  it("respects global disable", () => {
    expect(isEnabledForDomain({ enabled: false }, "example.com")).toBe(false);
  });

  it("disables configured domains and subdomains", () => {
    const settings = { enabled: true, disabledDomains: ["example.com"] };

    expect(isEnabledForDomain(settings, "mail.example.com")).toBe(false);
  });
});
