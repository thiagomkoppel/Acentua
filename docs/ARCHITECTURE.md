# Architecture

## Overview

Acentua uses a layered architecture:

```text
Browser event
    │
    ▼
Content script
    │
    ▼
Editor adapter
    │
    ▼
Tokenizer
    │
    ▼
Correction engine
    │
    ▼
Dictionary and settings
    │
    ▼
Editor adapter applies replacement
```

## Components

## 1. Manifest

`manifest.json` defines:

- Manifest V3.
- Content script.
- Background service worker.
- Popup.
- Options page.
- Icons.
- Storage permission.
- Required host access.

## 2. Content script

Responsibilities:

- Listen for relevant input or keyboard events.
- Identify the active editable element.
- Skip unsupported or excluded fields.
- Select the appropriate editor adapter.
- Request correction for the completed word.
- Apply a valid correction.
- Show local suggestions for ambiguous words when enabled.
- Record minimal last-correction metadata.

The content script must not contain dictionary rules or editor-specific implementation details.

## 3. Correction controller

The controller coordinates:

- Element eligibility.
- Word-boundary detection.
- Editor adapter selection.
- Correction-engine calls.
- Application of replacement.
- Ambiguous-suggestion handoff when no automatic correction is safe.
- Event dispatch.
- Last-correction state.

### Ambiguous suggestion manager

`src/content/ambiguous-suggestions.js` owns the local suggestion popover state. It renders a lightweight chip, accepts the first suggestion by click or the configured accept shortcut, dismisses by button or the configured dismiss shortcut, and lets `Escape` pass through to the page. The defaults are `Ctrl+.` / `Cmd+.` to accept and `Ctrl+,` / `Cmd+,` to dismiss.

## 4. Editor adapters

### Input adapter

Supports:

- `<input type="text">`
- `<input type="search">` if enabled
- `<textarea>`

Uses:

- `selectionStart`
- `selectionEnd`
- `setRangeText`
- Native input events

### Contenteditable adapter

Supports basic contenteditable elements.

Uses:

- `window.getSelection()`
- `Range`
- Text-node traversal
- Native input events

The first implementation should support simple contenteditable elements before complex rich-text applications.

### Future adapters

Potential dedicated adapters:

- Gmail.
- Outlook Web.
- WhatsApp Web.
- Google Docs.
- React-controlled inputs.
- ProseMirror.
- Quill.
- Draft.js.
- Slate.

Do not implement site-specific adapters before the base architecture is stable.

## 5. Tokenizer

Responsibilities:

- Locate the word immediately before the cursor.
- Return the word and its start and end offsets.
- Handle Portuguese letters.
- Stop at whitespace or punctuation.
- Normalize Unicode for lookup.
- Avoid consuming URLs, email addresses, and code-like tokens.

Suggested output:

```js
{
  word: "tambem",
  start: 3,
  end: 9,
  delimiter: " "
}
```

## 6. Correction engine

The correction engine is a pure module.

Input:

```js
{
  word: "Tambem",
  safeDictionary,
  ambiguousDictionary,
  ignoredWords,
  customDictionary
}
```

Output:

```js
{
  changed: true,
  original: "Tambem",
  corrected: "Também",
  source: "safe-dictionary"
}
```

Priority order:

1. Ignored words.
2. User custom dictionary.
3. Ambiguous dictionary no-change result with local suggestion metadata.
4. Default safe dictionary.
5. No change.

An ignored word must always remain unchanged.

A custom correction may override the default dictionary.

An ambiguous word must remain unchanged unless the user explicitly creates a custom correction. When suggestions are enabled, the engine returns local suggestion options but does not mutate text automatically.

## 7. Dictionary loader

Responsibilities:

- Load packaged JSON dictionaries.
- Load custom corrections from `chrome.storage`.
- Load ignored words.
- Validate entries.
- Merge dictionaries using documented priority rules.
- Cache dictionaries in memory.
- Refresh cache when settings change.

## 8. Background service worker

Responsibilities should remain minimal:

- Initialize default settings.
- Handle extension installation.
- Support message passing when needed.
- Manage storage migrations.
- Update extension badge or state if implemented.

Do not move typing analysis to the service worker. Content scripts need immediate local access.

## 9. Popup

The popup should display:

- Extension enabled state.
- Current website enabled state.
- Correction mode.
- Last correction.
- Link to options.

The popup should not display or store surrounding user text.

## 10. Options page

The options page should support:

- Global enable or disable.
- Per-site disabled list.
- Custom correction pairs.
- Ignored words.
- Import and export of settings.
- Reset to defaults.

## Data model

Suggested settings shape:

```js
{
  enabled: true,
  locale: "pt-BR",
  correctionMode: "safe",
  disabledDomains: [],
  customCorrections: {},
  ignoredWords: [],
  showCorrectionIndicator: true,
  preserveCapitalization: true,
  showAmbiguousSuggestions: true,
  shortcutKeys: {
    acceptSuggestion: ".",
    dismissSuggestion: ","
  }
}
```

Suggested last-correction shape:

```js
{
  original: "tambem",
  corrected: "também",
  timestamp: 1784131200000,
  domain: "mail.google.com"
}
```

Do not store the full sentence.

## Event strategy

A practical starting strategy:

1. Listen for `beforeinput`, `input`, and `keydown`.
2. Trigger correction when a delimiter is inserted.
3. Read the completed word immediately before the delimiter.
4. Apply a replacement through the adapter.
5. Dispatch an `input` event with an appropriate input type.

Browser undo behavior must be verified through integration tests.

Do not assume one event strategy works for every editor.

## Error handling

- Unsupported editor: do nothing.
- Invalid dictionary data: skip invalid entry and log only in development.
- Storage unavailable: use packaged defaults.
- Selection unavailable: do nothing.
- Replacement failure: leave text unchanged.
- Content script exception: isolate and avoid breaking page typing.

## Build output

The build process should generate a `dist/` directory containing only extension runtime files.

Source maps may be included in development builds and excluded from release builds.
