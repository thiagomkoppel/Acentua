import { DEFAULT_SETTINGS } from "../shared/settings.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULT_SETTINGS).then(saveDefaults);
});

function saveDefaults(stored) {
  return chrome.storage.local.set({ ...DEFAULT_SETTINGS, ...stored });
}
