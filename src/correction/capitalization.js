const LOCALE = "pt-BR";

export function applyCapitalization(original, corrected) {
  const value = corrected.normalize("NFC");
  if (isUpperCase(original)) return value.toLocaleUpperCase(LOCALE);
  if (isTitleCase(original)) return titleCase(value);
  return value;
}

function isUpperCase(value) {
  return hasLetters(value) && value === value.toLocaleUpperCase(LOCALE);
}

function isTitleCase(value) {
  const letters = Array.from(value);
  if (letters.length === 0) return false;
  return isUpper(letters[0]) && isLower(letters.slice(1).join(""));
}

function titleCase(value) {
  const letters = Array.from(value);
  return letters[0].toLocaleUpperCase(LOCALE) + letters.slice(1).join("");
}

function hasLetters(value) {
  return /\p{L}/u.test(value);
}

function isUpper(value) {
  return value === value.toLocaleUpperCase(LOCALE);
}

function isLower(value) {
  return value === value.toLocaleLowerCase(LOCALE);
}
