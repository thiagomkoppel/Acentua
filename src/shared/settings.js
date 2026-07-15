export const DEFAULT_SETTINGS = Object.freeze({
  customCorrections: {},
  disabledDomains: [],
  enabled: true,
  ignoredWords: [],
  locale: "pt-BR",
});

export function mergeSettings(value = {}) {
  const source = isPlainObject(value) ? value : {};
  return {
    customCorrections: cleanDictionary(source.customCorrections),
    disabledDomains: cleanDomains(source.disabledDomains),
    enabled: source.enabled !== false,
    ignoredWords: cleanWordList(source.ignoredWords),
    locale: "pt-BR",
  };
}

export async function readSettings(storage = defaultStorage()) {
  if (!storage?.get) return mergeSettings();
  const stored = await storage.get(DEFAULT_SETTINGS);
  return mergeSettings(stored);
}

export async function saveSettings(settings, storage = defaultStorage()) {
  if (!storage?.set) return;
  await storage.set(mergeSettings(settings));
}

export function isEnabledForDomain(settings = {}, hostname = "") {
  const merged = mergeSettings(settings);
  return merged.enabled && !isDomainDisabled(hostname, merged.disabledDomains);
}

export function cleanDictionary(value) {
  const output = {};
  if (!isPlainObject(value)) return output;
  Object.entries(value).forEach(([key, word]) =>
    addDictionaryEntry(output, key, word),
  );
  return output;
}

export function cleanWordList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanWord).filter(Boolean);
}

function cleanDomains(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanDomain).filter(Boolean);
}

function isDomainDisabled(hostname, domains) {
  const host = cleanDomain(hostname);
  return domains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

function addDictionaryEntry(output, key, word) {
  const cleanKey = cleanWord(key);
  const cleanValue = cleanDictionaryValue(word);
  if (canStoreEntry(cleanKey, cleanValue)) output[cleanKey] = cleanValue;
}

function canStoreEntry(key, value) {
  return isSafeObjectKey(key) && Boolean(value) && key !== value;
}

function cleanWord(value) {
  if (typeof value !== "string") return "";
  return value.trim().normalize("NFC").toLocaleLowerCase("pt-BR");
}

function cleanDictionaryValue(value) {
  if (typeof value !== "string") return "";
  return value.trim().normalize("NFC");
}

function cleanDomain(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/^https?:\/\//u, "")
    .split("/")[0]
    .toLocaleLowerCase("en-US");
}

function isSafeObjectKey(key) {
  return (
    Boolean(key) && !["__proto__", "constructor", "prototype"].includes(key)
  );
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

function defaultStorage() {
  return globalThis.chrome?.storage?.local;
}
