import { expect, test } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
let baseUrl;
let server;

test.beforeAll(async () => {
  server = createServer(serveFile);
  await listen(server);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
  await close(server);
});

test("corrects a textarea word in Chromium", async ({ page }) => {
  await openFixture(page);

  const notes = page.locator("#notes");

  await notes.pressSequentially("Eu tambem ");

  await expect(notes).toHaveValue("Eu tamb\u00e9m ");
  await expect.poll(() => cursorPosition(notes)).toBe(10);
});

test("corrects a basic contenteditable word", async ({ page }) => {
  await openFixture(page);

  const editor = page.locator("#editor");

  await editor.pressSequentially("Eu tambem ");

  await expect(editor).toHaveText("Eu tamb\u00e9m ");
});

test("shows and accepts an ambiguous suggestion by click", async ({ page }) => {
  await openFixture(page);

  const notes = page.locator("#notes");

  await notes.pressSequentially("esta ");
  await expect(suggestionButton(page)).toHaveText("est\u00e1?");
  await suggestionButton(page).click();

  await expect(notes).toHaveValue("est\u00e1 ");
});

test("renders ambiguous suggestions as a light chip", async ({ page }) => {
  await openFixture(page);

  await page.locator("#notes").pressSequentially("esta ");

  await expect
    .poll(() => suggestionStyle(page))
    .toEqual({
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(218, 220, 224)",
      color: "rgb(32, 33, 36)",
    });
});

test("positions ambiguous suggestions above inputs when possible", async ({
  page,
}) => {
  await openFixture(page);
  await page.addStyleTag({ content: "#notes { margin-top: 80px; }" });

  await page.locator("#notes").pressSequentially("esta ");

  const placement = await suggestionPlacement(page);
  expect(placement.popoverBottom).toBeLessThanOrEqual(placement.inputTop);
});

test("accepts an ambiguous suggestion by keyboard", async ({ page }) => {
  await openFixture(page);

  const notes = page.locator("#notes");

  await notes.pressSequentially("esta ");
  await page.keyboard.press("Control+Period");

  await expect(notes).toHaveValue("est\u00e1 ");
});

test("does not show ambiguous suggestions when disabled", async ({ page }) => {
  await openFixture(page, { showAmbiguousSuggestions: false });

  const notes = page.locator("#notes");

  await notes.pressSequentially("esta ");

  await expect(notes).toHaveValue("esta ");
  await expect(suggestionButton(page)).toHaveCount(0);
});

test("dismisses an ambiguous suggestion by keyboard", async ({ page }) => {
  await openFixture(page);

  const notes = page.locator("#notes");

  await notes.pressSequentially("esta ");
  await page.keyboard.press("Control+Comma");

  await expect(notes).toHaveValue("esta ");
  await expect(suggestionPopover(page)).toHaveCount(0);
});

test("dismisses an ambiguous suggestion by button", async ({ page }) => {
  await openFixture(page);

  const notes = page.locator("#notes");

  await notes.pressSequentially("esta ");
  await dismissButton(page).click();

  await expect(notes).toHaveValue("esta ");
  await expect(suggestionPopover(page)).toHaveCount(0);
});

test("lets Escape pass through to the page", async ({ page }) => {
  await openFixture(page);
  await trackEscape(page);

  await page.locator("#notes").pressSequentially("esta ");
  await page.keyboard.press("Escape");

  await expect(suggestionPopover(page)).toHaveCount(1);
  await expect.poll(() => escapeCount(page)).toBe(1);
});

async function openFixture(page, settings = {}) {
  await page.goto(`${baseUrl}/fixture/basic-inputs.html`);
  await installAcentua(page, settings);
}

async function installAcentua(page, settings) {
  await page.addScriptTag({ content: scriptContent(settings), type: "module" });
  await page.waitForFunction(() => window.__acentuaReady === true);
}

function scriptContent(settings) {
  return `
    window.__acentuaReady = false;
    Promise.all([
      import("${baseUrl}/src/content/correction-controller.js"),
      import("${baseUrl}/src/content/ambiguous-suggestions.js")
    ]).then(([{ createCorrectionHandler }, { createSuggestionManager }]) => {
      const state = ${JSON.stringify(testState(settings))};
      const getState = () => Promise.resolve(state);
      const suggestions = createSuggestionManager();
      document.addEventListener("input", createCorrectionHandler({ getState, suggestions }), true);
      document.addEventListener("keydown", suggestions.handleKeydown, true);
      window.__acentuaReady = true;
    });
  `;
}

function testState(settings = {}) {
  return {
    ambiguousDictionary: { esta: ["esta", "est\u00e1"] },
    safeDictionary: { tambem: "tamb\u00e9m" },
    settings: {
      customCorrections: {},
      disabledDomains: [],
      enabled: true,
      ignoredWords: [],
      showAmbiguousSuggestions: settings.showAmbiguousSuggestions ?? true,
    },
  };
}

function suggestionButton(page) {
  return page.locator(
    "[data-acentua-suggestion] button:not([data-acentua-dismiss])",
  );
}

function dismissButton(page) {
  return page.locator("[data-acentua-dismiss]");
}

function suggestionPopover(page) {
  return page.locator("[data-acentua-suggestion]");
}

async function suggestionStyle(page) {
  return suggestionPopover(page).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderTopColor,
      color: style.color,
    };
  });
}

async function suggestionPlacement(page) {
  return page.evaluate(() => {
    const field = document.querySelector("#notes").getBoundingClientRect();
    const chip = document.querySelector("[data-acentua-suggestion]");
    return {
      inputTop: field.top,
      popoverBottom: chip.getBoundingClientRect().bottom,
    };
  });
}

async function trackEscape(page) {
  await page.evaluate(() => {
    window.__acentuaEscapeCount = 0;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") window.__acentuaEscapeCount += 1;
    });
  });
}

async function escapeCount(page) {
  return page.evaluate(() => window.__acentuaEscapeCount);
}

async function cursorPosition(locator) {
  return locator.evaluate((element) => element.selectionStart);
}

function listen(httpServer) {
  return new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
}

function close(httpServer) {
  return new Promise((resolve) => httpServer.close(resolve));
}

async function serveFile(request, response) {
  const file = fileFor(request.url ?? "/");
  if (!file) return respondNotFound(response);
  response.setHeader("content-type", contentType(file));
  response.end(await readFile(file));
}

function fileFor(urlText) {
  const pathname = new URL(urlText, "http://localhost").pathname;
  if (pathname === "/fixture/basic-inputs.html") return fixturePath();
  if (pathname.startsWith("/src/")) return safeProjectPath(pathname);
  return null;
}

function fixturePath() {
  return path.join(root, "tests/fixtures/basic-inputs.html");
}

function safeProjectPath(pathname) {
  const file = path.normalize(path.join(root, pathname));
  return file.startsWith(root) ? file : null;
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function respondNotFound(response) {
  response.statusCode = 404;
  response.end("not found");
}
