import {
  DEFAULT_SETTINGS,
  parseShortcutKey,
  readSettings,
  saveSettings,
  shortcutLabel,
} from "../shared/settings.js";

const form = document.querySelector("#settings-form");
const status = document.querySelector("#status");
const shortcutFields = [
  ["#accept-suggestion-shortcut", "acceptSuggestion"],
  ["#dismiss-suggestion-shortcut", "dismissSuggestion"],
];

init();

async function init() {
  render(await readSettings());
  form.addEventListener("submit", saveFromForm);
  document.querySelector("#reset").addEventListener("click", resetDefaults);
  bindShortcutFields();
}

function render(settings) {
  renderToggles(settings);
  renderShortcutFields(settings.shortcutKeys);
  renderTextAreas(settings);
}

function renderToggles(settings) {
  field("#enabled").checked = settings.enabled;
  field("#show-ambiguous-suggestions").checked =
    settings.showAmbiguousSuggestions;
}

function renderTextAreas(settings) {
  field("#disabled-domains").value = settings.disabledDomains.join("\n");
  field("#ignored-words").value = settings.ignoredWords.join("\n");
  field("#custom-corrections").value = correctionsText(
    settings.customCorrections,
  );
}

async function saveFromForm(event) {
  event.preventDefault();
  await saveSettings(readForm());
  setStatus("Settings saved.");
}

async function resetDefaults() {
  await saveSettings(DEFAULT_SETTINGS);
  render(DEFAULT_SETTINGS);
  setStatus("Settings reset.");
}

function readForm() {
  return {
    customCorrections: parseCorrections(field("#custom-corrections").value),
    disabledDomains: lines(field("#disabled-domains").value),
    enabled: field("#enabled").checked,
    ignoredWords: lines(field("#ignored-words").value),
    shortcutKeys: readShortcutKeys(),
    showAmbiguousSuggestions: field("#show-ambiguous-suggestions").checked,
  };
}

function bindShortcutFields() {
  shortcutFields.forEach(([selector]) =>
    field(selector).addEventListener("keydown", captureShortcut),
  );
}

function captureShortcut(event) {
  if (!canCaptureShortcut(event)) return;
  event.preventDefault();
  event.currentTarget.value = shortcutLabel(event.key);
}

function canCaptureShortcut(event) {
  return hasCommandModifier(event) && isSingleShortcutKey(event.key);
}

function hasCommandModifier(event) {
  return event.ctrlKey || event.metaKey;
}

function isSingleShortcutKey(key) {
  return parseShortcutKey(key) === key;
}

function renderShortcutFields(keys) {
  shortcutFields.forEach(([selector, name]) =>
    renderShortcutField(selector, keys[name]),
  );
}

function renderShortcutField(selector, key) {
  field(selector).value = shortcutLabel(key);
}

function readShortcutKeys() {
  return Object.fromEntries(shortcutFields.map(shortcutEntry));
}

function shortcutEntry([selector, name]) {
  const fallback = DEFAULT_SETTINGS.shortcutKeys[name];
  return [name, parseShortcutKey(field(selector).value, fallback)];
}

function parseCorrections(value) {
  return Object.fromEntries(lines(value).map(parseCorrection).filter(Boolean));
}

function parseCorrection(line) {
  const [plain, accented] = line.split("=").map((part) => part.trim());
  return plain && accented ? [plain, accented] : null;
}

function correctionsText(corrections) {
  return Object.entries(corrections)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function lines(value) {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function field(selector) {
  return document.querySelector(selector);
}

function setStatus(message) {
  status.textContent = message;
}
