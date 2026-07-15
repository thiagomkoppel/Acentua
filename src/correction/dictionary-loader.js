import {
  cleanDictionary,
  cleanWordList,
  readSettings,
} from "../shared/settings.js";

const AMBIGUOUS_PATH = "src/dictionaries/pt-BR-ambiguous.json";
const IGNORED_PATH = "src/dictionaries/ignored-words.json";
const SAFE_PATH = "src/dictionaries/pt-BR-safe.json";

export async function loadCorrectionState(fetchJson = fetchExtensionJson) {
  const [packaged, settings] = await Promise.all([
    loadPackagedDictionaries(fetchJson),
    readSettings(),
  ]);
  return { ...packaged, settings };
}

export async function loadPackagedDictionaries(fetchJson = fetchExtensionJson) {
  const [safe, ambiguous, ignored] = await Promise.all([
    fetchJson(SAFE_PATH),
    fetchJson(AMBIGUOUS_PATH),
    fetchJson(IGNORED_PATH),
  ]);
  return cleanPackagedDictionaries(safe, ambiguous, ignored);
}

function cleanPackagedDictionaries(safe, ambiguous, ignored) {
  return {
    ambiguousDictionary: cleanAmbiguousDictionary(ambiguous),
    ignoredWords: cleanWordList(ignored),
    safeDictionary: cleanDictionary(safe),
  };
}

function cleanAmbiguousDictionary(value) {
  const output = Object.create(null);
  if (!value || typeof value !== "object") return output;
  Object.entries(value).forEach(([key, words]) =>
    addAmbiguous(output, key, words),
  );
  return output;
}

function addAmbiguous(output, key, words) {
  if (typeof key !== "string") return;
  const cleanKey = key.trim().normalize("NFC").toLocaleLowerCase("pt-BR");
  const cleanWords = cleanWordList(words);
  if (cleanKey && cleanWords.length > 0) output[cleanKey] = cleanWords;
}

async function fetchExtensionJson(path) {
  const response = await fetch(chrome.runtime.getURL(path));
  if (!response.ok) throw new Error("Dictionary load failed.");
  return response.json();
}
