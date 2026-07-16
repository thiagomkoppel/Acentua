import { pathToFileURL } from "node:url";

import {
  expandSafeDictionaryFiles,
  reportExpansion,
} from "./safe-dictionary-expander.js";

if (isMainModule()) main().catch(fail);

async function main() {
  reportExpansion(
    await expandSafeDictionaryFiles(parseArgs(process.argv.slice(2))),
  );
}

function parseArgs(args) {
  return {
    minLength: numberArg(args, "--min-length", 3),
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
