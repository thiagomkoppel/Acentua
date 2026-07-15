import { applyCapitalization } from "./capitalization.js";
import { normalizeLookupWord } from "./normalization.js";

export function correctWord(word, dictionaries = {}) {
  const original = normalizeOriginal(word);
  if (!original) return noChange("", "empty-word");
  return correctionFor(original, dictionaries);
}

function correctionFor(original, dictionaries) {
  const key = normalizeLookupWord(original);
  if (hasIgnoredWord(dictionaries.ignoredWords, key))
    return noChange(original, "ignored-word");
  return dictionaryCorrection(original, dictionaries, key);
}

function dictionaryCorrection(original, dictionaries, key) {
  const custom = lookup(dictionaries.customDictionary, key);
  if (custom) return change(original, custom, "custom-dictionary");
  return defaultCorrection(original, dictionaries, key);
}

function defaultCorrection(original, dictionaries, key) {
  const ambiguous = lookup(dictionaries.ambiguousDictionary, key);
  if (ambiguous) return ambiguousWord(original, key, ambiguous);
  return safeCorrection(original, dictionaries.safeDictionary, key);
}

function ambiguousWord(original, key, options) {
  return {
    ...noChange(original, "ambiguous-word"),
    suggestions: suggestionOptions(original, key, options),
  };
}

function suggestionOptions(original, key, options) {
  if (!Array.isArray(options)) return [];
  return options
    .filter((word) => normalizeLookupWord(word) !== key)
    .map((word) => applyCapitalization(original, word));
}

function safeCorrection(original, dictionary, key) {
  const safe = lookup(dictionary, key);
  if (safe) return change(original, safe, "safe-dictionary");
  return noChange(original, "unknown-word");
}

function change(original, corrected, reason) {
  return result(
    true,
    original,
    applyCapitalization(original, corrected),
    reason,
    1,
  );
}

function noChange(original, reason) {
  return result(false, original, original, reason, 0);
}

function result(changed, original, corrected, reason, confidence) {
  return { changed, confidence, corrected, original, reason };
}

function normalizeOriginal(word) {
  return typeof word === "string" ? word.normalize("NFC") : "";
}

function hasIgnoredWord(words, key) {
  return (
    Array.isArray(words) &&
    words.some((word) => normalizeLookupWord(word) === key)
  );
}

function lookup(dictionary, key) {
  if (!dictionary || typeof dictionary !== "object") return undefined;
  return Object.hasOwn(dictionary, key) ? dictionary[key] : undefined;
}
