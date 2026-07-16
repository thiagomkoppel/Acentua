import { correctWord } from "../correction/correction-engine.js";
import {
  getCompletedToken,
  getTokenBeforeCursor,
} from "../correction/tokenizer.js";
import { isEnabledForDomain } from "../shared/settings.js";
import { contenteditableAdapter } from "./contenteditable-adapter.js";
import { inputAdapter } from "./input-adapter.js";

const ADAPTERS = [inputAdapter, contenteditableAdapter];
const COMPLETION_KEYS = new Set(["Tab"]);

export function createCorrectionHandler(options) {
  const getHostname = options.getHostname ?? currentHostname;
  return (event) => handleInput(event, options, getHostname);
}

export function createCorrectionKeydownHandler(options) {
  const getHostname = options.getHostname ?? currentHostname;
  return (event) => handleCompletionKeydown(event, options, getHostname);
}

export async function handleInput(event, options, getHostname) {
  const context = readContext(event);
  if (!context) return dismissSuggestions(options);
  const state = await options.getState();
  if (!canHandle(state, getHostname)) return dismissSuggestions(options);
  handleContext(context, state, options);
}

export function handleCompletionKeydown(event, options, getHostname) {
  if (!isCompletionKey(event)) return;
  const request = keydownRequest(event, options);
  if (!canUseRequest(request, getHostname)) return dismissSuggestions(options);
  handlePendingContext(request.context, request.state, options, event.key);
}

function keydownRequest(event, options) {
  return {
    context: readContext(event),
    state: options.getCurrentState?.(),
  };
}

function canUseRequest(request, getHostname) {
  return (
    request.context && request.state && canHandle(request.state, getHostname)
  );
}

function handleContext(context, state, options) {
  const token = getCompletedToken(context.text, context.selection.start);
  if (!token) return dismissSuggestions(options);
  applyCorrection(context, token, state, options.suggestions);
}

function handlePendingContext(context, state, options, delimiter) {
  const token = getTokenBeforeCursor(
    context.text,
    context.selection.start,
    delimiter,
  );
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
  const target = editableTarget(event);
  if (!target) return null;
  const selection = target.adapter.getSelection(target.element);
  if (!isCollapsed(selection)) return null;
  return contextFor(target.element, target.adapter, selection);
}

function editableTarget(event) {
  return targetCandidates(event).map(editableFor).find(Boolean) ?? null;
}

function editableFor(element) {
  const adapter = adapterFor(element);
  return adapter ? { adapter, element } : null;
}

function targetCandidates(event) {
  const path = event.composedPath?.() ?? [event.target];
  return path.filter(isElement);
}

function isElement(value) {
  return value instanceof Element;
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
  suggestions?.show({
    context,
    options: result.suggestions,
    shortcutKeys: settings.shortcutKeys,
    token,
  });
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

function isCompletionKey(event) {
  return COMPLETION_KEYS.has(event.key) && !hasCommandModifier(event);
}

function hasCommandModifier(event) {
  return event.altKey || event.ctrlKey || event.metaKey;
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
