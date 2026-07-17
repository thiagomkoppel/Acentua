import { DEFAULT_SHORTCUT_KEYS } from "../shared/settings.js";

const DISMISS_ATTR = "data-acentua-dismiss";
const SUGGESTION_ATTR = "data-acentua-suggestion";

export function createSuggestionManager() {
  let state = emptyState();
  const getState = () => state;
  const setState = (next) => (state = next);
  return managerFor(getState, setState);
}

function managerFor(getState, setState) {
  return {
    dismiss: () => setState(dismiss(getState().popover)),
    handleKeydown: (event) => setState(handleKeydown(event, getState())),
    show: (suggestion) =>
      setState(show(suggestion, getState().popover, setState)),
  };
}

function emptyState() {
  return { pending: null, popover: null };
}

function show(suggestion, currentPopover, setState) {
  remove(currentPopover);
  if (!hasOptions(suggestion)) return emptyState();
  const popover = createPopover(suggestion, setState);
  preparePopover(popover);
  document.documentElement.append(popover);
  positionPopover(popover, suggestion.context.element);
  return { pending: suggestion, popover };
}

function dismiss(popover) {
  remove(popover);
  return emptyState();
}

function handleKeydown(event, state) {
  if (!state.pending) return state;
  if (isAcceptKey(event, state.pending)) return acceptFromKey(event, state);
  if (isDismissKey(event, state.pending)) return dismissFromKey(event, state);
  return state;
}

function acceptFromKey(event, state) {
  event.preventDefault();
  return accept(state.pending, state.popover);
}

function createPopover(suggestion, setState) {
  const popover = document.createElement("div");
  popover.setAttribute(SUGGESTION_ATTR, "");
  stylePopover(popover);
  popover.append(
    ...createOptionButtons(suggestion, setState),
    createDismissButton(setState),
  );
  return popover;
}

function createOptionButtons(suggestion, setState) {
  return suggestion.options.map((option) =>
    createButton(option, suggestion, setState),
  );
}

function createButton(option, suggestion, setState) {
  const button = document.createElement("button");
  configureButton(button, option);
  bindButtonEvents(button, option, suggestion, setState);
  return button;
}

function configureButton(button, option) {
  button.type = "button";
  button.textContent = `${option}?`;
  button.setAttribute("aria-label", `Use ${option}`);
  styleActionButton(button);
}

function bindButtonEvents(button, option, suggestion, setState) {
  button.addEventListener("mousedown", preventFocusLoss);
  button.addEventListener("click", () =>
    setState(accept(suggestion, nearestPopover(button), option)),
  );
}

function createDismissButton(setState) {
  const button = document.createElement("button");
  configureDismissButton(button);
  bindDismissButton(button, setState);
  return button;
}

function configureDismissButton(button) {
  button.type = "button";
  button.textContent = "x";
  button.setAttribute(DISMISS_ATTR, "");
  button.setAttribute("aria-label", "Dismiss suggestion");
  styleDismissButton(button);
}

function bindDismissButton(button, setState) {
  button.addEventListener("mousedown", preventFocusLoss);
  button.addEventListener("click", () =>
    setState(dismiss(nearestPopover(button))),
  );
}

function accept(suggestion, popover, option = firstOption(suggestion)) {
  replaceSuggestion(suggestion, option);
  return dismiss(popover);
}

function firstOption(suggestion) {
  return suggestion.options[0];
}

function replaceSuggestion(suggestion, corrected) {
  const replacement = replacementFor(suggestion, corrected);
  suggestion.context.adapter.replaceRange(...replacement);
}

function replacementFor(suggestion, corrected) {
  const { context, token } = suggestion;
  const cursor = nextCursor(context.selection, token, corrected);
  return [context.element, token.start, token.end, corrected, cursor];
}

function nextCursor(selection, token, corrected) {
  return selection.start + corrected.length - token.word.length;
}

function preparePopover(popover) {
  popover.style.visibility = "hidden";
}

function positionPopover(popover, element) {
  const rect = element.getBoundingClientRect();
  Object.assign(popover.style, positionedStyle(rect, popover));
}

function positionedStyle(rect, popover) {
  return {
    left: `${clampedLeft(rect, popover)}px`,
    top: `${preferredTop(rect, popover)}px`,
    visibility: "visible",
  };
}

function preferredTop(rect, popover) {
  return hasRoomAbove(rect, popover) ? aboveTop(rect, popover) : belowTop(rect);
}

function hasRoomAbove(rect, popover) {
  return rect.top >= popover.offsetHeight + 12;
}

function aboveTop(rect, popover) {
  return Math.max(8, rect.top - popover.offsetHeight - 6);
}

function belowTop(rect) {
  return Math.max(8, rect.bottom + 6);
}

function clampedLeft(rect, popover) {
  return clamp(rect.left, 8, window.innerWidth - popover.offsetWidth - 8);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function stylePopover(popover) {
  Object.assign(popover.style, popoverStyle());
}

function popoverStyle() {
  return { ...boxStyle(), ...textStyle(), ...layerStyle() };
}

function boxStyle() {
  return { ...layoutStyle(), ...surfaceStyle() };
}

function layoutStyle() {
  return {
    alignItems: "center",
    display: "inline-flex",
    gap: "2px",
    padding: "2px",
  };
}

function surfaceStyle() {
  return {
    background: "#ffffff",
    border: "1px solid #dadce0",
    borderRadius: "999px",
  };
}

function textStyle() {
  return { color: "#202124", font: "12px Arial, sans-serif", lineHeight: "1" };
}

function layerStyle() {
  return {
    boxShadow: "0 2px 8px rgba(60, 64, 67, 0.18)",
    position: "fixed",
    zIndex: "2147483647",
  };
}

function styleActionButton(button) {
  Object.assign(button.style, sharedButtonStyle(), actionButtonStyle());
}

function styleDismissButton(button) {
  Object.assign(button.style, sharedButtonStyle(), dismissButtonStyle());
}

function sharedButtonStyle() {
  return {
    background: "transparent",
    border: "0",
    borderRadius: "999px",
    cursor: "pointer",
    font: "inherit",
    padding: "3px 6px",
  };
}

function actionButtonStyle() {
  return { color: "#1a73e8" };
}

function dismissButtonStyle() {
  return { color: "#5f6368" };
}

function hasOptions(suggestion) {
  return Array.isArray(suggestion.options) && suggestion.options.length > 0;
}

function nearestPopover(element) {
  return element.closest(`[${SUGGESTION_ATTR}]`);
}

function preventFocusLoss(event) {
  event.preventDefault();
}

function dismissFromKey(event, state) {
  event.preventDefault();
  return dismiss(state.popover);
}

function isAcceptKey(event, suggestion) {
  return matchesShortcut(event, shortcutKey(suggestion, "acceptSuggestion"));
}

function isDismissKey(event, suggestion) {
  return matchesShortcut(event, shortcutKey(suggestion, "dismissSuggestion"));
}

function matchesShortcut(event, key) {
  return hasCommandModifier(event) && event.key === key;
}

function shortcutKey(suggestion, name) {
  return suggestion.shortcutKeys?.[name] ?? DEFAULT_SHORTCUT_KEYS[name];
}

function hasCommandModifier(event) {
  return event.ctrlKey || event.metaKey;
}

function remove(popover) {
  popover?.remove();
}
