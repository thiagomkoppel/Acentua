# Testing Strategy

## Goals

Testing must protect users from:

- Incorrect replacements.
- Cursor jumps.
- Broken Undo.
- Corrupted contenteditable markup.
- Corrections inside sensitive fields.
- Website state becoming inconsistent.
- Dictionary regressions.

## Test layers

## 1. Unit tests

Use Vitest for pure modules.

### Correction engine

Test:

- Safe word correction.
- Unknown words.
- Ambiguous words.
- Ambiguous suggestion options.
- Ignored words.
- Custom dictionary priority.
- Empty input.
- Unicode input.
- Already accented input.
- Locale-aware lowercase conversion.

### Capitalization

Test:

```text
voce → você
Voce → Você
VOCE → VOCÊ
vOcE → defined fallback behavior
```

### Tokenizer

Test:

- Word before a space.
- Word before punctuation.
- Word at beginning of field.
- Word in the middle of text.
- Multiple spaces.
- Accented letters.
- Hyphenated words.
- Apostrophes.
- Email addresses.
- URLs.
- Numbers.
- Emoji boundaries.

### Dictionary loader

Test:

- Valid files.
- Invalid entries.
- Conflicting safe and ambiguous entries.
- User custom entries.
- Storage defaults.
- Storage migrations.

### Dictionary validation tooling

Test validator behavior for sorted keys, duplicate keys, unsafe object keys, Unicode normalization, safe/ambiguous conflicts, ambiguous option shape, and ignored-word lists.

## 2. DOM integration tests

Use a browser-like environment for:

- Input adapter.
- Textarea adapter.
- Exclusion detection.
- Event dispatch.
- Cursor positioning.

These tests do not replace real-browser tests.

## 3. Playwright tests

Run the extension in Chromium.

Minimum cases:

### Standard input

1. Focus a text input.
2. Type `tambem `.
3. Expect `também `.
4. Expect cursor at the end.

### Textarea

1. Type a sentence containing multiple safe words.
2. Verify each correction.
3. Verify punctuation remains correct.

### Capitalization

Test lowercase, title case, and uppercase.

### Undo

1. Type `tambem `.
2. Verify correction.
3. Press Undo.
4. Verify the original text is restored.

### Sensitive fields

Verify no correction in:

- Password.
- Email.
- URL.
- Number.
- Telephone.

### Disabled website

Disable the current test domain and verify no correction occurs.

### Ignored word

Add `tambem` to ignored words and verify it remains unchanged.

### Custom correction

Add a custom pair and verify it is used.

### Popup PT mode

Verify the popup renders the current PT mode state, toggles the global enabled setting, and keeps the options link keyboard-accessible.

### Ambiguous suggestions

Verify suggestion display, multi-option rendering, light-chip styling, placement, click accept for each option, default and custom keyboard accept, setting disable, default and custom keyboard dismiss, dismiss-button behavior, and Escape pass-through.

### Basic contenteditable

Verify text replacement and cursor position in a simple contenteditable div.

### React-controlled input

Create a small test page with a controlled React input. Verify that displayed value and application state remain synchronized.

## Test fixtures

Create static pages under `tests/fixtures/`:

```text
basic-inputs.html
contenteditable.html
excluded-fields.html
react-controlled-input.html
rich-text.html
```

## Manual compatibility testing

Before release, manually test:

| Website | Input type | Expected support |
|---|---|---|
| Gmail | contenteditable | Partial or supported |
| Outlook Web | contenteditable | Partial or supported |
| WhatsApp Web | contenteditable | Partial or supported |
| LinkedIn | mixed | Supported where possible |
| Google Docs | custom editor | Not guaranteed |
| GitHub code editor | code editor | Excluded |

## Regression policy

Every reported correction bug must produce a regression test before or with the fix.

## Performance testing

Create a benchmark for:

- Dictionary lookup.
- Token extraction.
- Correction-engine call.
- Large custom dictionaries.

The typing path must remain fast and synchronous.

## Release checklist

- Unit tests pass.
- Playwright tests pass.
- Dictionary validator passes.
- No critical console errors.
- Undo verified manually.
- Sensitive-field exclusions verified.
- Disabled-site behavior verified.
- Production build loads as unpacked extension.
