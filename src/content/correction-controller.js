import { correctWord } from "../correction/correction-engine.js";
import { getCompletedToken } from "../correction/tokenizer.js";
import { isEnabledForDomain } from "../shared/settings.js";
import { contenteditableAdapter } from "./contenteditable-adapter.js";
import { inputAdapter } from "./input-adapter.js";

const ADAPTERS = [inputAdapter, contenteditableAdapter];

export function createCorrectionHandler(options) {
  const getHostname = options.getHostname ?? currentHostname;
  return (event) => handleInput(event, options, getHostname);
}

export async function handleInput(event, options, getHostname) {
  const context = readContext(event);
  if (!context) return dismissSuggestions(options);
  const state = await options.getState();
  if (!canHandle(state, getHostname)) return dismissSuggestions(options);
  handleContext(context, state, options);
}

function handleContext(context, state, options) {
  const token = getCompletedToken(context.text, context.selection.start);
  if (!token) return dismissSuggestions(options);
  applyCorrection(context, token, state, options.suggestions);
}

function canHandle(state, getHostname) {
  return isEnabledForDomain(state.settings, getHostname());
}

function dismissSuggestions(options) {
  options.suggestions?.dismiss();
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

function applyCorrection(context, token, state, suggestions) {
  const result = correctWord(token.word, dictionariesFor(state));
  if (result.changed)
    return replaceCorrection(context, token, result, suggestions);
  showSuggestion(context, token, result, state.settings, suggestions);
}

function replaceCorrection(context, token, result, suggestions) {
  suggestions?.dismiss();
  replaceText(context, token, result.corrected);
}

function showSuggestion(context, token, result, settings, suggestions) {
  if (!canSuggest(result, settings)) return suggestions?.dismiss();
  suggestions?.show({ context, options: result.suggestions, token });
}

function canSuggest(result, settings = {}) {
  return result.reason === "ambiguous-word" && canShow(settings, result);
}

function canShow(settings, result) {
  return (
    settings.showAmbiguousSuggestions !== false &&
    result.suggestions?.length > 0
  );
}

function replaceText(context, token, corrected) {
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
