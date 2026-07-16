import { pathToFileURL } from "node:url";

import {
  importAmbiguousDictionaryFiles,
  reportImport,
} from "./ambiguous-dictionary-importer.js";

if (isMainModule()) main().catch(fail);

async function main() {
  const result = await importAmbiguousDictionaryFiles(
    parseArgs(process.argv.slice(2)),
  );
  reportImport(result);
}

function parseArgs(args) {
  return {
    minLength: numberArg(args, "--min-length", 1),
    moveSafeConflicts: args.includes("--move-safe-conflicts"),
    source: stringArg(args, "--source"),
    write: args.includes("--write"),
  };
}

function stringArg(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? "" : args[index + 1];
}

function numberArg(args, name, fallback) {
  const value = stringArg(args, name);
  return value ? Number(value) : fallback;
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

function fail(error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
