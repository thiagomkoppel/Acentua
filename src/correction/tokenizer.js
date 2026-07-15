const COMPLETION_DELIMITERS = new Set([
  " ",
  "\u00A0",
  "\n",
  "\t",
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  ")",
  "]",
]);
const JOINING_PREFIXES = new Set(["-", "'", "’"]);

export function getCompletedToken(text, cursor = text.length) {
  if (!isCompletedPosition(text, cursor)) return null;
  return tokenAt(text, cursor);
}

function tokenAt(text, cursor) {
  const end = cursor - 1;
  const start = findWordStart(text, end);
  if (!isSafeWord(text, start, end)) return null;
  return token(text, start, end, cursor);
}

function token(text, start, end, cursor) {
  return {
    delimiter: text[cursor - 1],
    end,
    start,
    word: text.slice(start, end),
  };
}

function isCompletedPosition(text, cursor) {
  return (
    canReadToken(text, cursor) && COMPLETION_DELIMITERS.has(text[cursor - 1])
  );
}

function canReadToken(text, cursor) {
  return typeof text === "string" && cursor > 0 && cursor <= text.length;
}

function findWordStart(text, end) {
  let index = end;
  while (index > 0 && isWordChar(text[index - 1])) index -= 1;
  return index;
}

function isWordChar(char) {
  return /[\p{L}\p{M}]/u.test(char);
}

function isSafeWord(text, start, end) {
  return start !== end && !hasBlockedContext(text, start, end);
}

function hasBlockedContext(text, start, end) {
  return hasJoinedPrefix(text, start) || hasUnsafeSegment(text, start, end);
}

function hasJoinedPrefix(text, start) {
  return JOINING_PREFIXES.has(text[start - 1]);
}

function hasUnsafeSegment(text, start, end) {
  const segment = text.slice(findSegmentStart(text, start), end);
  return (
    segment.includes("@") || segment.includes("://") || segment.includes(".")
  );
}

function findSegmentStart(text, start) {
  let index = start;
  while (index > 0 && !/\s/u.test(text[index - 1])) index -= 1;
  return index;
}
