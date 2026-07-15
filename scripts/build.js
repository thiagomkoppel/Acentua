import { cp, mkdir, copyFile, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all([
  copyFile("manifest.json", "dist/manifest.json"),
  cp("src", "dist/src", { recursive: true }),
]);
