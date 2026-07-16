import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateDictionaryFiles } from "./dictionary-validator.js";

const LOCALE = "pt-BR";
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const WORD_PATTERN = /[\p{L}\p{M}]+/gu;
const FILES = {
  ambiguous: "src/dictionaries/pt-BR-ambiguous.json",
  ignored: "src/dictionaries/ignored-words.json",
  safe: "src/dictionaries/pt-BR-safe.json",
};

export async function expandAmbiguousDictionaryFiles(options = {}) {
  const config = configFor(options);
  const input = await expansionInput(config);
  const result = expandAmbiguousDictionary(input);
  if (config.write) await writeExpansion(config.root, result.dictionary);
  return { ...result, wrote: config.write };
}

export function expandAmbiguousDictionary(input) {
  const candidates = candidateMap(input.sourceText, input.minLength ?? 3);
  const addedEntries = acceptedEntries(candidates, input);
  return expansionResult(input, candidates, addedEntries);
}

export function reportExpansion(result, output = process.stdout) {
  output.write(`${reportLines(result).join("\n")}\n`);
}

function configFor(options) {
  const root = options.root ?? process.cwd();
  return {
    minLength: minLengthFor(options),
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
  const value = Number(options.minLength ?? 3);
  if (Number.isInteger(value) && value > 0) return value;
  throw new Error("--min-length must be a positive integer");
}

async function expansionInput(config) {
  const [sourceText, dictionaries] = await Promise.all([
    readFile(config.source, "utf8"),
    readDictionaries(config.root),
  ]);
  return { ...dictionaries, minLength: config.minLength, sourceText };
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
  return JSON.parse(await readFile(path.join(root, file), "utf8"));
}

async function writeExpansion(root, dictionary) {
  await writeFile(
    path.join(root, FILES.ambiguous),
    formatDictionary(dictionary),
  );
  await assertValid(root);
}

async function assertValid(root) {
  const result = await validateDictionaryFiles(root);
  if (!result.ok) throw new Error(result.errors.join("\n"));
}

function candidateMap(text, minLength) {
  const groups = rawCandidateMap(text, minLength);
  return new Map([...groups].filter(([, group]) => hasAccented(group)));
}

function rawCandidateMap(text, minLength) {
  return wordsFrom(text).reduce(
    (map, word) => addCandidate(map, word, minLength),
    new Map(),
  );
}

function wordsFrom(text) {
  return Array.from(String(text).matchAll(WORD_PATTERN), ([word]) =>
    cleanWord(word),
  );
}

function addCandidate(map, word, minLength) {
  const key = stripMarks(word);
  if (canGroup(key, minLength)) addCandidateWord(map, key, word);
  return map;
}

function addCandidateWord(map, key, word) {
  const group = map.get(key) ?? emptyGroup();
  group.options.add(word);
  if (word !== key) group.accented.add(word);
  map.set(key, group);
}

function emptyGroup() {
  return { accented: new Set(), options: new Set() };
}

function hasAccented(group) {
  return group.accented.size > 0;
}

function canGroup(key, minLength) {
  return key.length >= minLength;
}

function acceptedEntries(candidates, input) {
  const output = {};
  for (const [key, group] of sortedEntries(candidates))
    if (!rejectionReason(key, group, input))
      output[key] = optionsFor(key, group);
  return output;
}

function skippedEntries(candidates, input) {
  const entries = [];
  for (const [key, group] of sortedEntries(candidates))
    addSkippedEntry(entries, key, group, input);
  return entries;
}

function addSkippedEntry(entries, key, group, input) {
  const reason = rejectionReason(key, group, input);
  if (reason) entries.push(skippedEntry(key, group, reason));
}

function skippedEntry(key, group, reason) {
  return { key, options: optionsFor(key, group), reason };
}

function rejectionReason(key, group, input) {
  const check = rejectionChecks(input).find((item) => item.test(key, group));
  return check?.reason ?? "";
}

function rejectionChecks(input) {
  return [
    singleOptionCheck(),
    alreadyAmbiguousCheck(input),
    safeConflictCheck(input),
    ignoredCheck(input),
    unsafeKeyCheck(),
  ];
}

function singleOptionCheck() {
  return rejection("single-accented-option", (_key, group) =>
    hasOnlyOneGeneratedOption(group),
  );
}

function alreadyAmbiguousCheck(input) {
  return rejection("already-ambiguous", (key) =>
    hasKey(input.ambiguousDictionary, key),
  );
}

function safeConflictCheck(input) {
  return rejection("safe-conflict", (key) => hasKey(input.safeDictionary, key));
}

function ignoredCheck(input) {
  return rejection("ignored-word", (key) =>
    hasIgnored(input.ignoredWords, key),
  );
}

function unsafeKeyCheck() {
  return rejection("unsafe-key", (key) => !isSafeKey(key));
}

function rejection(reason, test) {
  return { reason, test };
}

function hasOnlyOneGeneratedOption(group) {
  return group.accented.size === 1 && group.options.size === 1;
}

function expansionResult(input, candidates, addedEntries) {
  const dictionary = mergedDictionary(input, addedEntries);
  return resultFor(candidates, addedEntries, dictionary, input);
}

function resultFor(candidates, addedEntries, dictionary, input) {
  return {
    addedCount: Object.keys(addedEntries).length,
    addedEntries,
    candidateCount: candidates.size,
    dictionary,
    skippedEntries: skippedEntries(candidates, input),
    wrote: false,
  };
}

function mergedDictionary(input, addedEntries) {
  return sortedObject({ ...input.ambiguousDictionary, ...addedEntries });
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
    `Candidates: ${result.candidateCount}`,
    `Added: ${result.addedCount}`,
    writeLine(result),
  ];
}

function writeLine(result) {
  if (result.wrote) return "Wrote: src/dictionaries/pt-BR-ambiguous.json";
  return "Wrote: no (dry run; add --write to update the dictionary)";
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

function optionsFor(key, group) {
  return [key, ...withoutKey(group.options, key)].sort(compareOptions);
}

function withoutKey(options, key) {
  return [...options].filter((option) => option !== key);
}

function sortedObject(dictionary) {
  const entries = Object.entries(dictionary).sort(([left], [right]) =>
    compare(left, right),
  );
  return Object.fromEntries(entries);
}

function sortedEntries(map) {
  return [...map.entries()].sort(([left], [right]) => compare(left, right));
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

function cleanWord(word) {
  return word.normalize("NFC").toLocaleLowerCase(LOCALE);
}

function stripMarks(word) {
  return word.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
}

function compare(left, right) {
  return left.localeCompare(right, LOCALE);
}

function compareOptions(left, right) {
  if (left === stripMarks(left)) return -1;
  if (right === stripMarks(right)) return 1;
  return compare(left, right);
}

function formatDictionary(dictionary) {
  return `${JSON.stringify(sortedObject(dictionary), null, 2)}\n`;
}
