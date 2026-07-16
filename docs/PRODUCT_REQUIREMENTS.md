# Product Requirements

## Product name

Acentua

## Problem

People who use an English keyboard layout often omit Portuguese diacritics because entering characters such as `ã`, `ç`, `é`, `ê`, `í`, `ó`, and `ú` is inconvenient.

Browser spell-checking may underline words, but it does not consistently replace them while the user types. This creates friction when writing email, messages, forms, social posts, and other Portuguese content.

## Product statement

Acentua automatically restores high-confidence Portuguese accents while the user types in the browser.

## Target user

The initial target user:

- Lives in an English-keyboard environment.
- Frequently writes Brazilian Portuguese.
- Does not want to switch keyboard layouts.
- Wants corrections to happen automatically.
- Values privacy and predictable behavior.

## User stories

### Automatic correction

As a user, I want `tambem` to become `também` after I finish typing the word.

### Capitalization

As a user, I want `Voce` to become `Você` and `VOCE` to become `VOCÊ`.

### Undo

As a user, I want `Ctrl+Z` or `Cmd+Z` to restore the text when a correction is not desired.

### Per-site control

As a user, I want to disable correction on a website without disabling the extension everywhere.

### Custom dictionary

As a user, I want to add a correction that is missing from the default dictionary.

### Ignored words

As a user, I want to prevent a particular word from being changed.

### Ambiguous suggestions

As a user, I want ambiguous words to stay unchanged unless I explicitly accept a suggested accent.

### Privacy

As a user, I want my emails and private messages to remain on my device.

## Functional requirements

### FR-1: Word completion detection

The extension must detect completed words after:

- Space.
- Enter.
- Tab.
- Period.
- Comma.
- Semicolon.
- Colon.
- Exclamation mark.
- Question mark.
- Closing parenthesis.
- Closing bracket.

Initial implementation may begin with Space and expand afterward.

### FR-2: Safe dictionary correction

The extension must look up the completed word in a local safe dictionary.

### FR-3: Capitalization preservation

The correction must preserve lowercase, title-case, and uppercase patterns.

### FR-4: Cursor preservation

The cursor must remain immediately after the corrected word and delimiter.

### FR-5: Undo compatibility

The correction must participate in the browser's normal undo history where technically possible.

### FR-6: Standard editor support

The MVP must support:

- Text inputs.
- Textareas.
- Basic contenteditable elements.

### FR-7: Site controls

The user must be able to:

- Enable or disable the extension globally.
- Disable or enable the current website.

### FR-8: User dictionary

The user must be able to add and remove custom correction pairs.

### FR-9: Ignored words

The user must be able to add and remove ignored words.

### FR-10: Last correction

The popup may display the last correction without storing surrounding text.

### FR-11: Local storage

Settings and dictionaries must use `chrome.storage`.

### FR-12: Ambiguous words

Ambiguous words must not be automatically corrected by the MVP. The extension may offer a local, explicit suggestion that the user can accept or dismiss by mouse or configured keyboard shortcut.

## Non-functional requirements

### NFR-1: Performance

Correction should feel immediate and should not noticeably delay typing.

Target processing time per completed word: less than 10 ms on a typical computer.

### NFR-2: Privacy

No typed text may be transmitted off-device.

### NFR-3: Reliability

Unsupported editors should fail safely by leaving text unchanged.

### NFR-4: Accessibility

Popup and options pages must support keyboard navigation and semantic labels.

### NFR-5: Maintainability

Correction logic must remain separate from DOM editing logic.

### NFR-6: Compatibility

Initial support target:

- Latest stable Google Chrome.
- Chromium-based Microsoft Edge when possible.

## Out of scope for MVP

- Full grammar correction.
- AI-based sentence rewriting.
- Translation.
- European Portuguese.
- Mobile Chrome.
- Firefox and Safari packages.
- Guaranteed Google Docs support.
- Cloud synchronization.
- User accounts.
- Team administration.
- Remote analytics.
- Automatic correction of ambiguous words.

## Acceptance criteria

The MVP is accepted when all of these scenarios pass:

1. Typing `tambem ` in a textarea produces `também `.
2. Typing `Voce ` produces `Você `.
3. Typing `VOCE ` produces `VOCÊ `.
4. Typing `esta ` remains `esta `.
5. Typing an unknown word leaves it unchanged.
6. The cursor remains after the inserted delimiter.
7. Undo restores the original text.
8. Password fields remain untouched.
9. Disabled websites remain untouched.
10. The extension works without internet access.
11. Ambiguous suggestions can be accepted or dismissed without changing text automatically.
