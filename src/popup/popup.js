import { readSettings } from "../shared/settings.js";

const state = document.querySelector("#state");
const options = document.querySelector("#options");

readSettings().then(renderState);
options.addEventListener("click", openOptions);

function renderState(settings) {
  state.textContent = settings.enabled
    ? "Corrections enabled."
    : "Corrections disabled.";
}

function openOptions() {
  chrome.runtime.openOptionsPage();
}
