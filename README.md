# Acentua

Acentua is a privacy-focused Chrome extension that restores high-confidence Brazilian Portuguese accents while users type with an English keyboard.

Examples:

- `tambem` -> `também`
- `voce` -> `você`
- `nao` -> `não`
- `informacao` -> `informação`
- `facil` -> `fácil`

The first version runs entirely in the browser. It does not send typed text to a server, use analytics, or store full sentences.

Install Acentua from the [Chrome Web Store](https://chromewebstore.google.com/detail/efijbmalniablofmklkgemdjefpcfkbf).

## First Version Scope

Implemented in this scaffold:

- Manifest V3 Chrome extension.
- Pure correction engine with structured results.
- Expanded sorted Brazilian Portuguese safe dictionary with 4,056 high-confidence entries.
- Separate ambiguous dictionary with 132 entries that blocks automatic replacement and offers local single-option or multi-option suggestions.
- Dictionary validation tooling for sorted entries, conflicts, normalization, and unsafe keys.
- Standard `input[type=text]`, `input[type=search]`, and `textarea` adapter.
- Basic `contenteditable` adapter for simple rich text fields.
- Correction after word-ending delimiters, including Space, punctuation, Enter, and Tab.
- Capitalization preservation for lowercase, title case, and uppercase words.
- Cursor preservation after replacement.
- Sensitive-field and code-context exclusions.
- Global enable setting, disabled domains, ignored words, and custom corrections in `chrome.storage`.
- Minimal popup with a quick PT mode toggle, plus an options page for ambiguous suggestions and shortcut settings.
- Extension icons generated from `src/assets/logo.png`.
- Unit tests plus Chromium browser integration tests.

Out of scope for this first slice:

- AI or server-side correction.
- Gmail, Google Docs, or site-specific adapters.
- Full grammar correction.
- Corpus-scale dictionary expansion.
- Cloud sync or accounts.

## Project Structure

```text
manifest.json
package.json
scripts/
  dictionary-validator.js
  validate-dictionaries.js
src/
  assets/logo.png
  assets/icons/
  background/service-worker.js
  content/ambiguous-suggestions.js
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
  scripts/dictionary-validator.test.js
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

Validate dictionaries:

```bash
npm run validate:dictionaries
```

Preview automatic safe-dictionary expansion from an accented word list or corpus:

```bash
npm run expand:safe -- --source path/to/pt-br-words.txt
```

Apply accepted additions to `src/dictionaries/pt-BR-safe.json`:

```bash
npm run expand:safe -- --source path/to/pt-br-words.txt --write
```

Preview automatic ambiguous-dictionary expansion from the same kind of source:

```bash
npm run expand:ambiguous -- --source path/to/pt-br-words.txt
```

Apply accepted additions to `src/dictionaries/pt-BR-ambiguous.json`:

```bash
npm run expand:ambiguous -- --source path/to/pt-br-words.txt --write
```

Preview a curated ambiguous JSON dictionary import:

```bash
npm run import:ambiguous -- --source path/to/acentua_pt_br_ambiguas.json
```

Move safe conflicts into the ambiguous dictionary and write both files:

```bash
npm run import:ambiguous -- --source path/to/acentua_pt_br_ambiguas.json --move-safe-conflicts --write
```

Run unit tests:

```bash
npm run test:unit
```

Run the browser integration tests:

```bash
npm run test:browser
```

Run the full verification suite, including dictionary validation:

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

For release packaging, zip the contents of `dist/` so `manifest.json` is at the archive root. The current local package path is `releases/acentua-0.1.1.zip`.

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

## Popup PT Mode

Click the Acentua toolbar icon to turn PT mode on or off quickly. Turning PT mode off pauses corrections everywhere, which is useful when writing in another language. The same global enabled setting is also available in Options.

## Ambiguous Suggestions

Ambiguous words such as `esta` are not corrected automatically. When suggestions are enabled, Acentua shows a small local popover near the active field. The popover is local-only, non-modal, and does not send typed text anywhere.

- Click a suggestion option to accept it. Multi-option words such as `avo` can show both `avó` and `avô`.
- Press `Ctrl+.` or `Cmd+.` to accept the first suggestion from the keyboard by default.
- Press `Ctrl+,` or `Cmd+,` to dismiss it from the keyboard by default.
- Click the small dismiss button to close it with the mouse.
- Change the accept and dismiss shortcuts in Options if you prefer another `Ctrl` or `Cmd` key, such as `Ctrl+]` and `Ctrl+[`.

## Options

The options page supports:

- Global enable or disable, also available as PT mode in the popup.
- Disabled domains, one per line, such as `example.com`.
- Ignored words, one per line.
- Ambiguous word suggestions on or off.
- Ambiguous suggestion keyboard shortcuts, such as `Ctrl+]` to accept and `Ctrl+[` to dismiss.
- Custom corrections, one per line, using `plain=accented` format.

Example custom correction:

```text
sao=são
```

## Privacy

Acentua only reads the completed word immediately before the cursor. It skips password, email, URL, number, telephone, date/time, likely payment, disabled, and code-context fields. Settings are stored locally with `chrome.storage`.

## Website Preview

A local static website page is available at `website/acentua/index.html` for testing public copy, demo fields, and privacy text. The `website/` folder is ignored by Git so local website and deploy files do not ship with extension source commits.

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

Mozilla Public License Version 2.0
