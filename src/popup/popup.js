import { readSettings, saveSettings } from "../shared/settings.js";

const state = document.querySelector("#state");
const toggle = document.querySelector("#toggle-enabled");
const options = document.querySelector("#options");
let currentSettings = null;

initPopup();

export async function initPopup() {
  currentSettings = await readSettings();
  renderState(currentSettings);
  toggle.addEventListener("click", toggleEnabled);
  options.addEventListener("click", openOptions);
}

export function renderState(settings) {
  const enabled = settings.enabled;
  state.textContent = statusText(enabled);
  toggle.textContent = toggleText(enabled);
  toggle.setAttribute("aria-pressed", String(enabled));
  toggle.setAttribute("aria-label", toggleLabel(enabled));
  setToggleDisabled(false);
}

async function toggleEnabled() {
  if (!currentSettings) return;
  setToggleDisabled(true);
  currentSettings = nextSettings(currentSettings);
  await saveSettings(currentSettings);
  renderState(currentSettings);
}

function nextSettings(settings) {
  return { ...settings, enabled: !settings.enabled };
}

function statusText(enabled) {
  return enabled ? "Acentua is active." : "Acentua is paused.";
}

function toggleText(enabled) {
  return enabled ? "PT mode on" : "PT mode off";
}

function toggleLabel(enabled) {
  return enabled ? "Turn PT mode off" : "Turn PT mode on";
}

function setToggleDisabled(value) {
  toggle.disabled = value;
}

function openOptions() {
  chrome.runtime.openOptionsPage();
}
