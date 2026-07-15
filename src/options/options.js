import {
  DEFAULT_SETTINGS,
  readSettings,
  saveSettings,
} from "../shared/settings.js";

const form = document.querySelector("#settings-form");
const status = document.querySelector("#status");

init();

async function init() {
  render(await readSettings());
  form.addEventListener("submit", saveFromForm);
  document.querySelector("#reset").addEventListener("click", resetDefaults);
}

function render(settings) {
  field("#enabled").checked = settings.enabled;
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
  };
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
