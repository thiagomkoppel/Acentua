const LOCALE = "pt-BR";

export function normalizeLookupWord(word) {
  return String(word).normalize("NFC").toLocaleLowerCase(LOCALE);
}
