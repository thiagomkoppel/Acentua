# AGENTS.md

## Project

Acentua is a Chrome extension that restores missing Portuguese accents while a user types with an English keyboard.

The extension must prioritize:

1. Correctness.
2. Privacy.
3. Predictable behavior.
4. Browser-native undo.
5. Minimal permissions.
6. Maintainable editor adapters.
7. Fast local execution.

## Primary objective

Build a reliable Manifest V3 Chrome extension that corrects high-confidence Brazilian Portuguese accent omissions.

Example:

```text
Eu tambem gostaria de participar.
```

becomes:

```text
Eu também gostaria de participar.
```

The correction should happen when the word is completed, normally after space, punctuation, Enter, or Tab.

## Required reading before implementation

Read these files before making architectural changes:

- `README.md`
- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/DICTIONARY_GUIDE.md`
- `docs/TESTING.md`
- `docs/SECURITY_AND_PRIVACY.md`

## Engineering rules

### Keep correction logic independent

The correction engine must not depend on the DOM.

It should accept plain text or a single word and return a structured result.

Preferred shape:

```js
{
  changed: true,
  original: "tambem",
  corrected: "também",
  reason: "safe-dictionary",
  confidence: 1
}
```

DOM interaction belongs in editor adapters.

### Separate editor types

Do not place all browser editing logic in one large content script.

Use separate adapters for:

- Standard input and textarea elements.
- Basic contenteditable elements.
- Future site-specific or framework-specific editors.

Each adapter should expose a common interface where practical:

```js
isSupported(element)
getTextBeforeCursor(element)
replaceRange(element, start, end, replacement)
getSelection(element)
restoreSelection(element, selection)
```

### Do not blindly mutate values

For standard text fields, prefer browser APIs such as:

```js
HTMLInputElement.prototype.setRangeText
```

For contenteditable fields, use Selection and Range APIs carefully.

After an edit, dispatch appropriate browser events so websites can update their internal state.

Do not rely only on:

```js
element.value = newValue
```

This can break controlled inputs and browser undo behavior.

### Preserve capitalization

These transformations are required:

```text
voce  → você
Voce  → Você
VOCE  → VOCÊ
```

Mixed or unusual capitalization should be preserved as safely as possible. Do not invent a new capitalization pattern unless there is a tested rule.

### Do not correct ambiguous words automatically

The MVP must not automatically replace words when the accent changes meaning or grammar.

Examples:

```text
esta / está
por / pôr
pode / pôde
secretaria / secretária
sabia / sabiá
```

Store these words in the ambiguous dictionary and leave them unchanged.

### Respect exclusions

Never process:

- Password fields.
- Email-address fields.
- URL fields.
- Number fields.
- Telephone fields.
- Date or time fields.
- Payment fields.
- Code editors.
- Elements under `pre` or `code`.
- Elements explicitly marked with `data-acentua-disabled`.
- Websites disabled by the user.
- Words on the user's ignored list.

### Privacy by default

Do not transmit typed text.

Do not add analytics, telemetry, crash reporting, remote logging, or external API calls without explicit project-owner approval.

Do not store full sentences or message content.

Stored data should be limited to:

- Extension settings.
- Disabled domains.
- User-defined correction pairs.
- Ignored words.
- Last correction, only when needed for popup feedback.
- Optional aggregate counters without typed content.

### Minimal Chrome permissions

Use the smallest possible set of permissions.

Likely permissions:

```json
{
  "permissions": ["storage"],
  "host_permissions": ["<all_urls>"]
}
```

Evaluate whether broad host access can be reduced or made optional before release.

Do not add permissions merely for convenience.

### Keep the first release local

Do not introduce an AI API, server, database, authentication system, or cloud synchronization into the MVP.

Contextual grammar correction belongs to a later phase.

## Coding standards

- Use JavaScript ES modules.
- Prefer small pure functions.
- Use descriptive names.
- Avoid global mutable state.
- Validate data loaded from storage or JSON.
- Add JSDoc for public functions and complex types.
- Keep modules focused.
- Avoid dependencies for logic that can be implemented safely in a few lines.
- Use `Intl` or locale-aware functions with `pt-BR` where relevant.
- Never use `innerHTML` for user-provided content.
- Escape any text rendered in popup or options UI.
- Keep UI accessible with labels, keyboard navigation, and visible focus states.

## Testing requirements

Every correction rule requires tests.

Minimum unit-test coverage:

- Safe dictionary lookup.
- Unknown word remains unchanged.
- Ambiguous word remains unchanged.
- Lowercase correction.
- Capitalized correction.
- Uppercase correction.
- Punctuation boundary handling.
- Apostrophe and hyphen behavior.
- Unicode normalization.
- Ignored words.
- Custom user dictionary overriding default behavior.
- Disabled-domain behavior.

Minimum browser tests:

- Input field correction.
- Textarea correction.
- Cursor remains correct.
- Undo restores original word.
- No correction in password fields.
- No correction in email fields.
- No correction inside code elements.
- Contenteditable correction.
- React-controlled input compatibility where feasible.

Do not mark a feature complete until tests cover its expected behavior and important failure cases.

## Dictionary contribution rules

A word belongs in `pt-BR-safe.json` only when replacing the unaccented form is highly reliable.

Before adding a word:

1. Confirm the accented spelling.
2. Verify the unaccented form is not commonly valid with a different meaning.
3. Add singular and plural or gender variants explicitly when needed.
4. Add capitalization tests through the engine, not duplicate dictionary entries.
5. Avoid names, brands, abbreviations, and domain-specific vocabulary.
6. Add ambiguous cases to `pt-BR-ambiguous.json`.

Dictionary files must remain sorted alphabetically.

## Git workflow

Use small, focused commits.

Suggested commit sequence:

1. Project scaffold.
2. Correction engine.
3. Input and textarea adapter.
4. Content script integration.
5. Popup and settings.
6. Contenteditable adapter.
7. Browser tests.
8. Dictionary expansion.
9. Documentation and release preparation.

Do not combine unrelated refactors with feature work.

## Definition of done for MVP

The MVP is complete when:

- It loads successfully as a Manifest V3 unpacked extension.
- It corrects safe words in input and textarea elements.
- It supports basic contenteditable fields.
- It preserves capitalization.
- It preserves cursor position.
- Undo works normally.
- It ignores sensitive and unsupported fields.
- Users can disable it globally and per website.
- Users can add custom corrections and ignored words.
- Typed text never leaves the browser.
- Unit and browser tests pass.
- The extension has no critical console errors.
- Documentation reflects the implementation.

## First task for Codex

Start with the smallest functional vertical slice:

1. Create the project scaffold.
2. Add Manifest V3 configuration.
3. Implement a pure correction engine.
4. Add a small safe dictionary.
5. Implement standard input and textarea correction.
6. Correct the word when the user presses Space.
7. Preserve capitalization and cursor position.
8. Add unit tests.
9. Add one browser integration test.
10. Document how to load the extension in Chrome.

Do not begin with Gmail, Google Docs, AI correction, or a large dictionary.
