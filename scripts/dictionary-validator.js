import { readFile } from "node:fs/promises";
import path from "node:path";

const LOCALE = "pt-BR";
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const FILES = {
  ambiguous: "src/dictionaries/pt-BR-ambiguous.json",
  ignored: "src/dictionaries/ignored-words.json",
  safe: "src/dictionaries/pt-BR-safe.json",
};

export async function validateDictionaryFiles(root = process.cwd()) {
  return validateDictionaries(await readDictionaryFiles(root));
}

export function validateDictionaries(files) {
  const errors = parseErrors(files);
  if (errors.length > 0) return validationResult(errors);
  return validationResult(validationErrors(files));
}

async function readDictionaryFiles(root) {
  const entries = await Promise.all(fileEntries(root));
  return Object.fromEntries(entries);
}

function fileEntries(root) {
  return Object.entries(FILES).map(([name, file]) =>
    readEntry(root, name, file),
  );
}

async function readEntry(root, name, file) {
  const raw = await readFile(path.join(root, file), "utf8");
  return [name, parsedEntry(file, raw)];
}

function parsedEntry(file, raw) {
  const parsed = parseJson(file, raw);
  return { data: parsed.data, errors: parsed.errors, file, raw };
}

function parseJson(file, raw) {
  try {
    return { data: JSON.parse(raw), errors: [] };
  } catch (error) {
    return { data: null, errors: [message(file, error.message)] };
  }
}

function parseErrors(files) {
  return Object.values(files).flatMap((entry) => entry.errors ?? []);
}

function validationErrors(files) {
  return [
    ...validateSafe(files.safe),
    ...validateAmbiguous(files.ambiguous),
    ...validateIgnored(files.ignored),
    ...conflictErrors(files.safe.data, files.ambiguous.data),
  ];
}

function validateSafe(entry) {
  const errors = objectErrors(entry, "safe dictionary");
  if (errors.length > 0) return errors;
  return dictionaryErrors(entry, safeEntryErrors);
}

function validateAmbiguous(entry) {
  const errors = objectErrors(entry, "ambiguous dictionary");
  if (errors.length > 0) return errors;
  return dictionaryErrors(entry, ambiguousEntryErrors);
}

function validateIgnored(entry) {
  if (!Array.isArray(entry.data))
    return [message(entry.file, "ignored words must be an array")];
  return listErrors(entry);
}

function objectErrors(entry, label) {
  if (isPlainObject(entry.data)) return [];
  return [message(entry.file, `${label} must be a JSON object`)];
}

function dictionaryErrors(entry, validateEntry) {
  return [
    ...duplicateKeyErrors(entry),
    ...sortedKeyErrors(entry),
    ...Object.entries(entry.data).flatMap(([key, value]) =>
      validateEntry(entry.file, key, value),
    ),
  ];
}

function listErrors(entry) {
  return [
    ...duplicateListErrors(entry.file, entry.data),
    ...sortedListErrors(entry.file, entry.data),
    ...entry.data.flatMap((word) =>
      wordErrors(entry.file, "ignored word", word),
    ),
  ];
}

function safeEntryErrors(file, key, value) {
  if (typeof value !== "string")
    return [message(file, `${key} must map to a string`)];
  return [...keyErrors(file, key), ...safeValueErrors(file, key, value)];
}

function safeValueErrors(file, key, value) {
  return [
    ...wordErrors(file, `${key} value`, value),
    ...identicalErrors(file, key, value),
  ];
}

function ambiguousEntryErrors(file, key, value) {
  if (!Array.isArray(value))
    return [message(file, `${key} must map to an array`)];
  return [...keyErrors(file, key), ...ambiguousValueErrors(file, key, value)];
}

function ambiguousValueErrors(file, key, value) {
  return [
    ...ambiguousLengthErrors(file, key, value),
    ...ambiguousContainsKeyErrors(file, key, value),
    ...value.flatMap((word) => wordErrors(file, `${key} option`, word)),
  ];
}

function ambiguousLengthErrors(file, key, value) {
  if (value.length >= 2) return [];
  return [message(file, `${key} must list at least two options`)];
}

function ambiguousContainsKeyErrors(file, key, value) {
  if (value.includes(key)) return [];
  return [message(file, `${key} options must include the plain key`)];
}

function keyErrors(file, key) {
  return [...wordErrors(file, "key", key), ...unsafeKeyErrors(file, key)];
}

function wordErrors(file, label, word) {
  if (typeof word !== "string")
    return [message(file, `${label} must be a string`)];
  return compact([
    emptyError(file, label, word),
    lowerError(file, label, word),
    nfcError(file, label, word),
  ]);
}

function unsafeKeyErrors(file, key) {
  if (!UNSAFE_KEYS.has(key)) return [];
  return [message(file, `${key} is not allowed as a dictionary key`)];
}

function identicalErrors(file, key, value) {
  if (key !== value) return [];
  return [message(file, `${key} must not map to itself`)];
}

function emptyError(file, label, word) {
  return word.trim() === ""
    ? message(file, `${label} must not be empty`)
    : null;
}

function lowerError(file, label, word) {
  return word === lower(word)
    ? null
    : message(file, `${label} must be lowercase: ${word}`);
}

function nfcError(file, label, word) {
  return word === word.normalize("NFC")
    ? null
    : message(file, `${label} must be NFC-normalized: ${word}`);
}

function duplicateKeyErrors(entry) {
  return duplicateKeys(entry.raw).map((key) =>
    message(entry.file, `${key} is duplicated`),
  );
}

function duplicateKeys(raw) {
  return duplicates(topLevelKeys(raw));
}

function topLevelKeys(raw) {
  return Array.from(raw.matchAll(/"([^"]+)"\s*:/gu), ([, key]) => key);
}

function duplicateListErrors(file, words) {
  return duplicates(words).map((word) =>
    message(file, `${word} is duplicated`),
  );
}

function sortedKeyErrors(entry) {
  return sortedErrors(entry.file, Object.keys(entry.data), "keys");
}

function sortedListErrors(file, words) {
  return sortedErrors(file, words, "entries");
}

function sortedErrors(file, values, label) {
  if (isSorted(values)) return [];
  return [message(file, `${label} must be sorted alphabetically`)];
}

function conflictErrors(safe, ambiguous) {
  return Object.keys(safe).flatMap((key) => conflictForKey(key, ambiguous));
}

function conflictForKey(key, ambiguous) {
  if (!Object.hasOwn(ambiguous, key)) return [];
  return [message(FILES.safe, `${key} also exists in ambiguous dictionary`)];
}

function duplicates(values) {
  return [
    ...new Set(
      values.filter((value, index) => values.indexOf(value) !== index),
    ),
  ];
}

function isSorted(values) {
  return values.every(
    (value, index) => index === 0 || compare(values[index - 1], value) <= 0,
  );
}

function compare(left, right) {
  return left.localeCompare(right, LOCALE);
}

function lower(value) {
  return value.toLocaleLowerCase(LOCALE);
}

function isPlainObject(value) {
  return Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function compact(values) {
  return values.filter(Boolean);
}

function message(file, text) {
  return `${file}: ${text}`;
}

function validationResult(errors) {
  return { errors, ok: errors.length === 0 };
}
