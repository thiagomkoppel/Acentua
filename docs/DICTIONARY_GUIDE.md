# Dictionary Guide

## Purpose

Acentua uses dictionaries to decide whether a missing accent can be restored safely.

The dictionary must prioritize precision over size. A wrong automatic correction is more disruptive than leaving a word unchanged.

## Dictionary files

### `pt-BR-safe.json`

Contains unaccented forms that can be safely replaced.

Example:

```json
{
  "tambem": "também",
  "voce": "você"
}
```

### `pt-BR-ambiguous.json`

Contains words where accented and unaccented forms may both be valid.

Example:

```json
{
  "esta": ["esta", "está"],
  "por": ["por", "pôr"],
  "pode": ["pode", "pôde"]
}
```

The MVP must not automatically replace these words.

### `ignored-words.json`

Contains packaged words or token patterns that should never be corrected.

User-specific ignored words belong in `chrome.storage`.

## Entry rules

A safe entry must satisfy all conditions:

1. The accented spelling is correct in Brazilian Portuguese.
2. The unaccented input is a common result of typing without diacritics.
3. The unaccented form is not commonly valid as a different Portuguese word.
4. The correction does not require sentence context.
5. The correction does not depend on grammar, tense, or part of speech.
6. The entry is not a name, brand, abbreviation, URL, or technical identifier.

## Ambiguous examples

Do not place these in the safe dictionary:

```text
esta → esta / está
por → por / pôr
pode → pode / pôde
sabia → sabia / sabiá
secretaria → secretaria / secretária
publico → publico / público / publicou
```

## Capitalization

Store only lowercase dictionary keys and values.

The correction engine handles:

```text
voce → você
Voce → Você
VOCE → VOCÊ
```

Do not add duplicate uppercase or title-case entries.

## Inflection handling

For the MVP, list forms explicitly.

Example:

```json
{
  "informacao": "informação",
  "informacoes": "informações",
  "necessaria": "necessária",
  "necessarias": "necessárias",
  "necessario": "necessário",
  "necessarios": "necessários"
}
```

Do not implement automatic stemming until there is a clear need and strong test coverage.

## Sorting

Dictionary keys must remain alphabetically sorted.

## Validation script

Create a script that checks:

- Valid JSON.
- Lowercase keys.
- Lowercase values where applicable.
- Duplicate keys.
- Empty strings.
- Identical key and value.
- Conflicts between safe and ambiguous dictionaries.
- Unicode normalization.
- Alphabetical order.

## User custom corrections

Custom corrections take priority over the packaged safe and ambiguous dictionaries.

Example:

```json
{
  "thiago": "Thiago"
}
```

The options UI should warn that custom entries may create unwanted replacements.

## Adding a new entry

For each new entry:

1. Verify spelling.
2. Search for ambiguity.
3. Add the entry to the correct file.
4. Add or update a unit test.
5. Run dictionary validation.
6. Run the full test suite.
7. Keep the change focused.

## Initial safe dictionary

A small initial list is preferable:

```json
{
  "curriculo": "currículo",
  "dificil": "difícil",
  "entao": "então",
  "experiencia": "experiência",
  "facil": "fácil",
  "ingles": "inglês",
  "informacao": "informação",
  "informacoes": "informações",
  "nao": "não",
  "necessaria": "necessária",
  "necessario": "necessário",
  "portugues": "português",
  "possivel": "possível",
  "tambem": "também",
  "voce": "você",
  "voces": "vocês"
}
```
