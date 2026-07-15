const CODE_SELECTOR = "pre,code,.cm-editor,.monaco-editor,.ace_editor";
const DISABLED_SELECTOR = "[data-acentua-disabled]";

export const contenteditableAdapter = Object.freeze({
  getSelection,
  getTextBeforeCursor,
  isSupported,
  replaceRange,
  restoreSelection,
});

export function isSupported(element) {
  const root = editableRoot(element);
  return Boolean(root) && !hasExcludedAncestor(root);
}

export function getSelection(element) {
  const root = editableRoot(element);
  const range = activeRange(root);
  if (!range?.collapsed) return null;
  const offset = textOffset(root, range.startContainer, range.startOffset);
  return { end: offset, start: offset };
}

export function getTextBeforeCursor(element) {
  const root = editableRoot(element);
  const range = activeRange(root);
  if (!range) return "";
  return textBeforeRange(root, range);
}

export function replaceRange(element, start, end, replacement, cursor) {
  const root = editableRoot(element);
  const range = rangeForOffsets(root, start, end);
  selectRange(range);
  insertText(root, replacement);
  restoreSelection(root, { end: cursor, start: cursor });
}

export function restoreSelection(element, selection) {
  const root = editableRoot(element) ?? element;
  selectRange(rangeForOffsets(root, selection.start, selection.end));
}

function editableRoot(element) {
  if (!(element instanceof Element)) return null;
  return element.closest('[contenteditable=""],[contenteditable="true"]');
}

function hasExcludedAncestor(element) {
  return Boolean(element.closest(`${DISABLED_SELECTOR},${CODE_SELECTOR}`));
}

function activeRange(root) {
  const selection = root?.ownerDocument.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return containsRange(root, range) ? range : null;
}

function containsRange(root, range) {
  return (
    containsNode(root, range.startContainer) &&
    containsNode(root, range.endContainer)
  );
}

function containsNode(root, node) {
  return root === node || root.contains(node);
}

function textBeforeRange(root, range) {
  const before = root.ownerDocument.createRange();
  before.selectNodeContents(root);
  before.setEnd(range.startContainer, range.startOffset);
  return before.toString();
}

function rangeForOffsets(root, start, end) {
  const range = root.ownerDocument.createRange();
  const from = positionForOffset(root, start);
  const to = positionForOffset(root, end);
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  return range;
}

function positionForOffset(root, target) {
  let remaining = target;
  for (const node of textNodes(root)) {
    if (remaining <= node.length) return { node, offset: remaining };
    remaining -= node.length;
  }
  return { node: root, offset: root.childNodes.length };
}

function textOffset(root, targetNode, targetOffset) {
  let offset = 0;
  for (const node of textNodes(root)) {
    if (node === targetNode) return offset + targetOffset;
    offset += node.length;
  }
  return offset;
}

function textNodes(root) {
  return Array.from(walkTextNodes(root));
}

function* walkTextNodes(root) {
  const walker = createTextWalker(root);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) yield node;
}

function createTextWalker(root) {
  return root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
}

function selectRange(range) {
  const selection = range.startContainer.ownerDocument.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertText(root, text) {
  if (root.ownerDocument.execCommand("insertText", false, text)) return;
  fallbackInsertText(root, text);
}

function fallbackInsertText(root, text) {
  const range = root.ownerDocument.getSelection().getRangeAt(0);
  range.deleteContents();
  range.insertNode(root.ownerDocument.createTextNode(text));
  root.dispatchEvent(createInputEvent(text));
}

function createInputEvent(data) {
  return new InputEvent("input", {
    bubbles: true,
    data,
    inputType: "insertReplacementText",
  });
}
