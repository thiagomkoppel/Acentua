// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("popup", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = popupMarkup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders PT mode as active by default", async () => {
    await loadPopup(fakeStorage({}));

    expect(toggle().textContent).toBe("PT mode on");
    expect(toggle().getAttribute("aria-pressed")).toBe("true");
    expect(status().textContent).toBe("Acentua is active.");
  });

  it("toggles PT mode off and saves the setting", async () => {
    const storage = fakeStorage({ enabled: true });
    await loadPopup(storage);

    toggle().click();
    await settle();

    expect(storage.data.enabled).toBe(false);
    expect(toggle().textContent).toBe("PT mode off");
    expect(status().textContent).toBe("Acentua is paused.");
  });

  it("opens the options page", async () => {
    const chrome = chromeFor(fakeStorage({}));
    vi.stubGlobal("chrome", chrome);
    await importPopup();
    await settle();

    document.querySelector("#options").click();

    expect(chrome.runtime.openOptionsPage).toHaveBeenCalledOnce();
  });
});

async function loadPopup(storage) {
  vi.stubGlobal("chrome", chromeFor(storage));
  await importPopup();
  await settle();
}

function fakeStorage(initial) {
  return {
    data: { ...initial },
    async get(defaults) {
      return { ...defaults, ...this.data };
    },
    async set(value) {
      this.data = { ...this.data, ...value };
    },
  };
}

function chromeFor(storage) {
  return {
    runtime: { openOptionsPage: vi.fn() },
    storage: { local: storage },
  };
}

function popupMarkup() {
  return `
    <p id="state"></p>
    <button id="toggle-enabled"></button>
    <button id="options"></button>
  `;
}

function toggle() {
  return document.querySelector("#toggle-enabled");
}

function status() {
  return document.querySelector("#state");
}

async function importPopup() {
  await import("../../src/popup/popup.js");
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}
