import { correctWord } from "../correction/correction-engine.js";
import { getCompletedToken } from "../correction/tokenizer.js";
import { isEnabledForDomain } from "../shared/settings.js";
import { contenteditableAdapter } from "./contenteditable-adapter.js";
import { inputAdapter } from "./input-adapter.js";

const ADAPTERS = [inputAdapter, contenteditableAdapter];

export function createCorrectionHandler(options) {
  const getHostname = options.getHostname ?? currentHostname;
  return (event) => handleInput(event, options.getState, getHostname);
}

export async function handleInput(event, getState, getHostname) {
  const context = readContext(event);
  if (!context) return;
  const state = await getState();
  if (!isEnabledForDomain(state.settings, getHostname())) return;
  const token = getCompletedToken(context.text, context.selection.start);
  if (!token) return;
  applyCorrection(context, token, state);
}

function readContext(event) {
  const adapter = adapterFor(event.target);
  if (!adapter) return null;
  const selection = adapter.getSelection(event.target);
  if (!isCollapsed(selection)) return null;
  return contextFor(event.target, adapter, selection);
}

function adapterFor(element) {
  return ADAPTERS.find((adapter) => adapter.isSupported(element));
}

function contextFor(element, adapter, selection) {
  return {
    adapter,
    element,
    selection,
    text: adapter.getTextBeforeCursor(element),
  };
}

function applyCorrection(context, token, state) {
  const result = correctWord(token.word, dictionariesFor(state));
  if (!result.changed) return;
  replaceCorrection(context, token, result.corrected);
}

function replaceCorrection(context, token, corrected) {
  const cursor = nextCursor(context.selection, token, corrected);
  context.adapter.replaceRange(
    context.element,
    token.start,
    token.end,
    corrected,
    cursor,
  );
}

function dictionariesFor(state) {
  const settings = state.settings ?? {};
  return {
    ...state,
    customDictionary: settings.customCorrections,
    ignoredWords: settings.ignoredWords,
  };
}

function isCollapsed(selection) {
  return selection && selection.start === selection.end;
}

function nextCursor(selection, token, corrected) {
  return selection.start + corrected.length - token.word.length;
}

function currentHostname() {
  return globalThis.location?.hostname ?? "";
}
