import { describe, expect, it } from "vitest";

import {
  isEnabledForDomain,
  mergeSettings,
} from "../../src/shared/settings.js";

describe("settings", () => {
  it("defaults to enabled", () => {
    expect(mergeSettings({}).enabled).toBe(true);
  });

  it("defaults ambiguous suggestions to enabled", () => {
    expect(mergeSettings({}).showAmbiguousSuggestions).toBe(true);
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
