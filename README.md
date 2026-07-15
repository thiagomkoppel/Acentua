# Acentua

Acentua is a privacy-focused Chrome extension that restores high-confidence Brazilian Portuguese accents while users type with an English keyboard.

Examples:

- `tambem` -> `também`
- `voce` -> `você`
- `nao` -> `não`
- `informacao` -> `informação`
- `facil` -> `fácil`

The first version runs entirely in the browser. It does not send typed text to a server, use analytics, or store full sentences.

## First Version Scope

Implemented in this scaffold:

- Manifest V3 Chrome extension.
- Pure correction engine with structured results.
- Small sorted Brazilian Portuguese safe dictionary.
- Separate ambiguous dictionary that blocks automatic replacement.
- Standard `input[type=text]`, `input[type=search]`, and `textarea` adapter.
- Basic `contenteditable` adapter for simple rich text fields.
- Correction after word-ending delimiters, including Space and punctuation.
- Capitalization preservation for lowercase, title case, and uppercase words.
- Cursor preservation after replacement.
- Sensitive-field and code-context exclusions.
- Global enable setting, disabled domains, ignored words, and custom corrections in `chrome.storage`.
- Minimal popup and options page.
- Extension icons generated from `src/assets/logo.png`.
- Unit tests plus Chromium browser integration tests.

Out of scope for this first slice:

- AI or server-side correction.
- Gmail, Google Docs, or site-specific adapters.
- Full grammar correction.
- Large dictionary expansion.
- Cloud sync or accounts.

## Project Structure

```text
manifest.json
package.json
src/
  assets/logo.png
  assets/icons/
  background/service-worker.js
  content/content-script.js
  content/contenteditable-adapter.js
  content/correction-controller.js
  content/input-adapter.js
  correction/capitalization.js
  correction/correction-engine.js
  correction/dictionary-loader.js
  correction/normalization.js
  correction/tokenizer.js
  dictionaries/pt-BR-safe.json
  dictionaries/pt-BR-ambiguous.json
  dictionaries/ignored-words.json
  options/
  popup/
tests/
  browser/basic-inputs.spec.js
  content/input-adapter.test.js
  correction/*.test.js
  shared/settings.test.js
```

## Requirements

- Node.js 20 or newer.
- npm.
- Google Chrome or Chromium for manual extension loading.

## Development

Install dependencies:

```bash
npm install
```

Run unit tests:

```bash
npm run test:unit
```

Run the browser integration tests:

```bash
npm run test:browser
```

Run the full verification suite:

```bash
npm test
```

Run lint and formatting checks:

```bash
npm run lint
npm run format
```

Build the unpacked extension directory:

```bash
npm run build
```

The build output is written to `dist/`.

## Load In Chrome

1. Run `npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose this project's `dist/` directory.
6. Open a normal webpage with a text field, textarea, or basic rich text editor.
7. Type `Eu tambem ` and confirm it becomes `Eu também `.

After rebuilding, click **Reload** on the extension in `chrome://extensions` and refresh any already-open test pages.

For quick development, you can also load the project root directly because `manifest.json` is at the root. Use `dist/` for cleaner release-style testing.

## Options

The options page supports:

- Global enable or disable.
- Disabled domains, one per line, such as `example.com`.
- Ignored words, one per line.
- Custom corrections, one per line, using `plain=accented` format.

Example custom correction:

```text
sao=são
```

## Privacy

Acentua only reads the completed word immediately before the cursor. It skips password, email, URL, number, telephone, date/time, likely payment, disabled, and code-context fields. Settings are stored locally with `chrome.storage`.

## Known Limits

- Google Docs is not supported yet.
- Complex editors may need site-specific adapters.
- Ambiguous words are intentionally not corrected automatically.

## Documentation

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Dictionary guide](docs/DICTIONARY_GUIDE.md)
- [Testing strategy](docs/TESTING.md)
- [Security and privacy](docs/SECURITY_AND_PRIVACY.md)

## License

Choose a license before publishing. MIT is appropriate for a permissive open-source release.
