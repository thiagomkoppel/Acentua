import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateDictionaryFiles } from "./dictionary-validator.js";

const LOCALE = "pt-BR";
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const FILES = {
  ambiguous: "src/dictionaries/pt-BR-ambiguous.json",
  ignored: "src/dictionaries/ignored-words.json",
  safe: "src/dictionaries/pt-BR-safe.json",
};

export async function importAmbiguousDictionaryFiles(options = {}) {
  const config = configFor(options);
  const input = await importInput(config);
  const result = importAmbiguousDictionary(input);
  if (config.write) await writeImport(config.root, result);
  return { ...result, wrote: config.write };
}

export function importAmbiguousDictionary(input) {
  const entries = sourceEntries(input.sourceDictionary, input.minLength ?? 1);
  const addedEntries = acceptedEntries(entries, input);
  return importResult(input, entries, addedEntries);
}

export function reportImport(result, output = process.stdout) {
  output.write(`${reportLines(result).join("\n")}\n`);
}

function configFor(options) {
  const root = options.root ?? process.cwd();
  return {
    minLength: minLengthFor(options),
    moveSafeConflicts: options.moveSafeConflicts === true,
    root,
    source: sourceFor(options, root),
    write: options.write === true,
  };
}

function sourceFor(options, root) {
  if (options.source) return path.resolve(root, options.source);
  throw new Error("--source is required");
}

function minLengthFor(options) {
  const value = Number(options.minLength ?? 1);
  if (Number.isInteger(value) && value > 0) return value;
  throw new Error("--min-length must be a positive integer");
}

async function importInput(config) {
  const [sourceDictionary, dictionaries] = await Promise.all([
    readJsonFile(config.source),
    readDictionaries(config.root),
  ]);
  return { ...config, ...dictionaries, sourceDictionary };
}

async function readDictionaries(root) {
  const [safeDictionary, ambiguousDictionary, ignoredWords] = await Promise.all(
    [
      readJson(root, FILES.safe),
      readJson(root, FILES.ambiguous),
      readJson(root, FILES.ignored),
    ],
  );
  return { ambiguousDictionary, ignoredWords, safeDictionary };
}

async function readJson(root, file) {
  return readJsonFile(path.join(root, file));
}

async function readJsonFile(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeImport(root, result) {
  await Promise.all([
    writeJson(root, FILES.ambiguous, result.ambiguousDictionary),
    writeJson(root, FILES.safe, result.safeDictionary),
  ]);
  await assertValid(root);
}

async function writeJson(root, file, dictionary) {
  await writeFile(path.join(root, file), formatJson(dictionary));
}

async function assertValid(root) {
  const result = await validateDictionaryFiles(root);
  if (!result.ok) throw new Error(result.errors.join("\n"));
}

function sourceEntries(dictionary, minLength) {
  if (!isPlainObject(dictionary)) return [];
  return Object.entries(dictionary).map(([key, value]) =>
    sourceEntry(key, value, minLength),
  );
}

function sourceEntry(key, value, minLength) {
  const cleanKey = cleanWord(key);
  const options = cleanOptions(value, cleanKey);
  return {
    key: cleanKey,
    options,
    valid: isValidEntry(cleanKey, options, minLength),
  };
}

function cleanOptions(value, key) {
  if (!Array.isArray(value)) return [];
  return sortOptions(unique([key, ...value.map(cleanWord)]), key);
}

function isValidEntry(key, options, minLength) {
  return (
    key.length >= minLength && options.length >= 2 && options.includes(key)
  );
}

function acceptedEntries(entries, input) {
  const output = {};
  entries.forEach((entry) => addAccepted(output, entry, input));
  return output;
}

function addAccepted(output, entry, input) {
  if (!rejectionReason(entry, input)) output[entry.key] = entry.options;
}

function skippedEntries(entries, input) {
  return entries.flatMap((entry) => skippedEntry(entry, input));
}

function skippedEntry(entry, input) {
  const reason = rejectionReason(entry, input);
  return reason ? [{ ...entry, reason }] : [];
}

function rejectionReason(entry, input) {
  const check = rejectionChecks(input).find((item) => item.test(entry));
  return check?.reason ?? "";
}

function rejectionChecks(input) {
  return [
    invalidEntryCheck(),
    alreadyAmbiguousCheck(input),
    safeConflictCheck(input),
    ignoredCheck(input),
    unsafeKeyCheck(),
  ];
}

function invalidEntryCheck() {
  return rejection("invalid-entry", (entry) => !entry.valid);
}

function alreadyAmbiguousCheck(input) {
  return rejection("already-ambiguous", (entry) =>
    hasKey(input.ambiguousDictionary, entry.key),
  );
}

function safeConflictCheck(input) {
  return rejection("safe-conflict", (entry) =>
    hasSafeConflict(input, entry.key),
  );
}

function ignoredCheck(input) {
  return rejection("ignored-word", (entry) =>
    hasIgnored(input.ignoredWords, entry.key),
  );
}

function unsafeKeyCheck() {
  return rejection("unsafe-key", (entry) => !isSafeKey(entry.key));
}

function hasSafeConflict(input, key) {
  return hasKey(input.safeDictionary, key) && !input.moveSafeConflicts;
}

function rejection(reason, test) {
  return { reason, test };
}

function importResult(input, entries, addedEntries) {
  return {
    ...addedResult(input, addedEntries),
    skippedEntries: skippedEntries(entries, input),
    sourceCount: entries.length,
    wrote: false,
  };
}

function addedResult(input, addedEntries) {
  return {
    addedCount: Object.keys(addedEntries).length,
    addedEntries,
    ambiguousDictionary: mergedAmbiguous(input, addedEntries),
    movedSafeCount: movedSafeKeys(input, addedEntries).length,
    safeDictionary: prunedSafe(input, addedEntries),
  };
}

function mergedAmbiguous(input, addedEntries) {
  return sortedObject({ ...input.ambiguousDictionary, ...addedEntries });
}

function prunedSafe(input, addedEntries) {
  const moved = new Set(movedSafeKeys(input, addedEntries));
  return sortedObject(withoutKeys(input.safeDictionary, moved));
}

function movedSafeKeys(input, addedEntries) {
  if (!input.moveSafeConflicts) return [];
  return Object.keys(addedEntries).filter((key) =>
    hasKey(input.safeDictionary, key),
  );
}

function withoutKeys(dictionary, keys) {
  return Object.fromEntries(
    Object.entries(dictionary).filter(([key]) => !keys.has(key)),
  );
}

function reportLines(result) {
  return [
    ...summaryLines(result),
    ...skipLines(result),
    ...previewLines(result),
  ];
}

function summaryLines(result) {
  return [
    `Source entries: ${result.sourceCount}`,
    `Added: ${result.addedCount}`,
    `Moved from safe: ${result.movedSafeCount}`,
    writeLine(result),
  ];
}

function writeLine(result) {
  if (result.wrote) return "Wrote: ambiguous and safe dictionaries";
  return "Wrote: no (dry run; add --write to update dictionaries)";
}

function skipLines(result) {
  return Object.entries(skipCounts(result.skippedEntries)).map(skipLine);
}

function skipCounts(entries) {
  return entries.reduce((counts, entry) => increment(counts, entry.reason), {});
}

function increment(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}

function skipLine([reason, count]) {
  return `Skipped ${reason}: ${count}`;
}

function previewLines(result) {
  const entries = Object.entries(result.addedEntries).slice(0, 12);
  if (entries.length === 0) return [];
  return ["Preview:", ...entries.map(formatEntry)];
}

function formatEntry([key, values]) {
  return `  ${key} -> [${values.join(", ")}]`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sortOptions(values, key) {
  return values.sort((left, right) => compareOption(left, right, key));
}

function compareOption(left, right, key) {
  if (left === key) return -1;
  if (right === key) return 1;
  return compare(left, right);
}

function sortedObject(dictionary) {
  const entries = Object.entries(dictionary).sort(([left], [right]) =>
    compare(left, right),
  );
  return Object.fromEntries(entries);
}

function hasKey(dictionary, key) {
  return Boolean(dictionary) && Object.hasOwn(dictionary, key);
}

function hasIgnored(words, key) {
  return Array.isArray(words) && words.includes(key);
}

function isSafeKey(key) {
  return Boolean(key) && !UNSAFE_KEYS.has(key);
}

function cleanWord(value) {
  if (typeof value !== "string") return "";
  return value.trim().normalize("NFC").toLocaleLowerCase(LOCALE);
}

function compare(left, right) {
  return left.localeCompare(right, LOCALE);
}

function formatJson(dictionary) {
  return `${JSON.stringify(sortedObject(dictionary), null, 2)}\n`;
}

function isPlainObject(value) {
  return Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;
}
