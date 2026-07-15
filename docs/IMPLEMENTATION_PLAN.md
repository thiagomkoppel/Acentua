# Implementation Plan

## Phase 0: Project setup

### Tasks

- Initialize npm project.
- Configure ES modules.
- Add ESLint.
- Add Prettier.
- Add Vitest.
- Add Playwright.
- Add build script.
- Add `src`, `tests`, and `dist` directories.
- Create Manifest V3 file.
- Add placeholder icons.
- Add a minimal popup.
- Confirm the extension loads in Chrome.

### Deliverable

An unpacked extension that loads without errors.

## Phase 1: Pure correction engine

### Tasks

- Implement dictionary loader.
- Implement Unicode normalization.
- Implement capitalization preservation.
- Implement ignored-word handling.
- Implement custom-dictionary priority.
- Implement ambiguous-word blocking.
- Add initial safe dictionary.
- Add unit tests.

### Initial safe words

Begin with a small verified set:

```text
tambem → também
voce → você
voces → vocês
nao → não
entao → então
informacao → informação
informacoes → informações
ingles → inglês
portugues → português
facil → fácil
dificil → difícil
possivel → possível
curriculo → currículo
experiencia → experiência
necessario → necessário
necessaria → necessária
```

### Deliverable

A tested pure function that returns correct structured results.

## Phase 2: Input and textarea support

### Tasks

- Detect eligible input elements.
- Ignore unsafe input types.
- Detect word completion after Space.
- Extract the word before the cursor.
- Apply replacement with `setRangeText`.
- Dispatch input event.
- Preserve cursor.
- Test browser Undo.
- Add Playwright integration tests.

### Deliverable

Typing `tambem ` in a textarea produces `também `.

## Phase 3: Additional delimiters

### Tasks

Support:

- Period.
- Comma.
- Semicolon.
- Colon.
- Question mark.
- Exclamation mark.
- Enter.
- Tab.
- Closing punctuation.

Ensure punctuation remains unchanged after correction.

### Deliverable

Safe correction works at normal sentence boundaries.

## Phase 4: Extension controls

### Tasks

- Add global enabled setting.
- Add current-site enabled setting.
- Add disabled-domain storage.
- Add popup controls.
- Add last-correction display.
- Add extension badge state if useful.
- Add storage-change listeners.

### Deliverable

Users can disable the extension globally or for the current website.

## Phase 5: Options page

### Tasks

- Manage custom corrections.
- Manage ignored words.
- Manage disabled websites.
- Reset settings.
- Export settings to JSON.
- Import settings from JSON with validation.
- Add accessible form labels and keyboard behavior.

### Deliverable

Users can customize behavior without editing files.

## Phase 6: Basic contenteditable support

### Tasks

- Detect contenteditable ancestors.
- Read text before the current selection.
- Locate the completed word in text nodes.
- Replace only the target range.
- Restore selection.
- Dispatch input event.
- Test simple rich-text editors.
- Test Gmail cautiously without promising full support.

### Deliverable

Basic contenteditable fields work without corrupting markup.

## Phase 7: Dictionary expansion

### Tasks

- Expand safe dictionary gradually.
- Add ambiguous dictionary.
- Add tests for every new category.
- Sort dictionaries.
- Document sources and validation process.
- Add optional tooling to detect duplicate values and conflicts.

### Deliverable

A useful dictionary with high precision.

## Phase 8: Compatibility hardening

### Tasks

Test:

- Gmail.
- Outlook Web.
- WhatsApp Web.
- LinkedIn.
- Facebook.
- Common forms.
- React-controlled inputs.
- Contenteditable editors.

Document unsupported or partial behavior.

### Deliverable

A compatibility matrix and stable release candidate.

## Phase 9: Release preparation

### Tasks

- Create production icons.
- Write Chrome Web Store description.
- Create privacy policy.
- Review permissions.
- Remove development logs.
- Build release zip.
- Add semantic version.
- Add changelog.
- Run complete test suite.

### Deliverable

Chrome Web Store-ready package.

## Future phase: Contextual suggestions

Only after the safe engine is stable:

- Detect ambiguous words.
- Show non-intrusive suggestions.
- Analyze nearby words locally.
- Add optional language-model integration.
- Require explicit opt-in for cloud processing.
- Clearly explain privacy implications.

Do not block the MVP on contextual correction.
