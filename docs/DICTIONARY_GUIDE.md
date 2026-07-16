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

The MVP must not automatically replace these words. They may be offered as explicit, user-confirmed local suggestions.

### `ignored-words.json`

Contains packaged words or token patterns that should never be corrected.

User-specific ignored words belong in `chrome.storage`.

## Current packaged dictionaries

This version ships with 326 sorted safe entries and an expanded ambiguous dictionary. The dictionary is still intentionally conservative: additions must remain high-confidence, local, and test-backed.

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

## Automatic safe expansion

Use the guarded expander when you have a trusted accented word list or Portuguese text corpus:

```bash
npm run expand:safe -- --source path/to/pt-br-words.txt
```

The default command is a dry run. It reports candidate count, additions, skipped reasons, and a preview. To apply accepted additions:

```bash
npm run expand:safe -- --source path/to/pt-br-words.txt --write
```

The safe expander only adds entries when one unaccented key maps to exactly one accented candidate and the key is not already safe, ambiguous, ignored, or unsafe. It still cannot prove grammatical safety, so review the diff and run the full test suite before release.

Use the ambiguous expander when you want to add only ambiguous entries from a trusted source:

```bash
npm run expand:ambiguous -- --source path/to/pt-br-words.txt
```

The default command is also a dry run. To apply accepted additions:

```bash
npm run expand:ambiguous -- --source path/to/pt-br-words.txt --write
```

The ambiguous expander adds entries when the source shows either a plain word plus an accented variant, such as `esta` and `está`, or multiple accented variants that collapse to the same plain key, such as `avó` and `avô`. It skips keys already in the safe dictionary and reports them as safe conflicts for manual review.

If you already have a curated JSON dictionary shaped like `{ "esta": ["esta", "está"] }`, use the importer instead:

```bash
npm run import:ambiguous -- --source path/to/acentua_pt_br_ambiguas.json
```

By default, safe conflicts are skipped. To treat the imported list as authoritative and move conflicting keys out of `pt-BR-safe.json`:

```bash
npm run import:ambiguous -- --source path/to/acentua_pt_br_ambiguas.json --move-safe-conflicts --write
```

Use `--min-length 3` if you want to skip short frequent words such as `a`, `e`, `de`, and `do`.

## Validation script

Run dictionary validation before committing dictionary changes:

```bash
npm run validate:dictionaries
```

The script checks:

- Valid JSON.
- Lowercase keys.
- Lowercase values where applicable.
- Duplicate keys.
- Empty strings.
- Identical key and value.
- Conflicts between safe and ambiguous dictionaries.
- Unicode normalization.
- Unsafe object keys such as `__proto__`, `constructor`, and `prototype`.
- Ambiguous entries that do not include the plain key.
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

## Starter safe dictionary example

The project started from a small verified list like this before expanding:

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
