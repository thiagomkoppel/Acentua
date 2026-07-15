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
  await page.goto(`${baseUrl}/fixture/basic-inputs.html`);
  await installAcentua(page);

  const notes = page.locator("#notes");

  await notes.pressSequentially("Eu tambem ");

  await expect(notes).toHaveValue("Eu também ");
  await expect.poll(() => cursorPosition(notes)).toBe(10);
});

test("corrects a basic contenteditable word", async ({ page }) => {
  await page.goto(`${baseUrl}/fixture/basic-inputs.html`);
  await installAcentua(page);

  const editor = page.locator("#editor");

  await editor.pressSequentially("Eu tambem ");

  await expect(editor).toHaveText("Eu também ");
});

async function installAcentua(page) {
  await page.addScriptTag({ content: scriptContent(), type: "module" });
  await page.waitForFunction(() => window.__acentuaReady === true);
}

function scriptContent() {
  return `
    window.__acentuaReady = false;
    import("${baseUrl}/src/content/correction-controller.js").then(({ createCorrectionHandler }) => {
      const state = ${JSON.stringify(testState())};
      const getState = () => Promise.resolve(state);
      document.addEventListener("input", createCorrectionHandler({ getState }), true);
      window.__acentuaReady = true;
    });
  `;
}

function testState() {
  return {
    ambiguousDictionary: { esta: ["esta", "está"] },
    safeDictionary: { tambem: "também" },
    settings: {
      customCorrections: {},
      disabledDomains: [],
      enabled: true,
      ignoredWords: [],
    },
  };
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
