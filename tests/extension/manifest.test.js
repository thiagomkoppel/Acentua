import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));

describe("manifest", () => {
  it("runs the content script in all frames", () => {
    expect(manifest.content_scripts[0]).toMatchObject({
      all_frames: true,
      matches: ["<all_urls>"],
    });
  });
});
