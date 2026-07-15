const CODE_SELECTOR = "pre,code,.cm-editor,.monaco-editor,.ace_editor";
const DISABLED_SELECTOR = "[data-acentua-disabled]";
const SENSITIVE_HINTS = ["card", "cc-", "cvc", "cvv", "otp", "secret", "token"];
const TEXT_INPUT_TYPES = new Set(["", "search", "text"]);

export const inputAdapter = Object.freeze({
  getSelection,
  getTextBeforeCursor,
  isSupported,
  replaceRange,
  restoreSelection,
});

export function isSupported(element) {
  return isEditableField(element) && !isExcluded(element);
}

export function getSelection(element) {
  if (!hasTextSelection(element)) return null;
  return { end: element.selectionEnd, start: element.selectionStart };
}

export function getTextBeforeCursor(element) {
  return element.value.slice(0, element.selectionStart ?? 0);
}

export function replaceRange(element, start, end, replacement, cursor) {
  element.setRangeText(replacement, start, end, "preserve");
  restoreSelection(element, { end: cursor, start: cursor });
  element.dispatchEvent(createInputEvent(replacement));
}

export function restoreSelection(element, selection) {
  element.setSelectionRange(selection.start, selection.end);
}

function isEditableField(element) {
  return isTextArea(element) || isTextInput(element);
}

function isTextArea(element) {
  return element instanceof HTMLTextAreaElement;
}

function isTextInput(element) {
  return (
    element instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(element.type)
  );
}

function isExcluded(element) {
  return hasExcludedAncestor(element) || hasSensitiveHint(element);
}

function hasExcludedAncestor(element) {
  return Boolean(element.closest(`${DISABLED_SELECTOR},${CODE_SELECTOR}`));
}

function hasSensitiveHint(element) {
  const text = sensitiveText(element);
  return SENSITIVE_HINTS.some((hint) => text.includes(hint));
}

function sensitiveText(element) {
  return ["autocomplete", "id", "name", "placeholder"]
    .map((name) => element.getAttribute(name) ?? "")
    .join(" ")
    .toLocaleLowerCase("en-US");
}

function hasTextSelection(element) {
  return (
    Number.isInteger(element.selectionStart) &&
    Number.isInteger(element.selectionEnd)
  );
}

function createInputEvent(data) {
  if (typeof InputEvent !== "function")
    return new Event("input", { bubbles: true });
  return new InputEvent("input", {
    bubbles: true,
    data,
    inputType: "insertReplacementText",
  });
}
