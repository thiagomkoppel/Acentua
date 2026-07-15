import { pathToFileURL } from "node:url";

import { validateDictionaryFiles } from "./dictionary-validator.js";

if (isMainModule()) {
  const result = await validateDictionaryFiles();
  report(result);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

function report(result) {
  if (result.ok) return pass();
  fail(result.errors);
}

function pass() {
  process.stdout.write("Dictionary validation passed.\n");
}

function fail(errors) {
  errors.forEach((error) => process.stderr.write(`${error}\n`));
  process.exitCode = 1;
}
