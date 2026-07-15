# Security and Privacy

## Privacy principle

Acentua should process the smallest possible amount of text for the shortest possible time.

The extension only needs the completed word immediately before the cursor. It does not need the full email, message, or page.

## Local-only MVP

The MVP must:

- Run entirely in the browser.
- Use packaged dictionaries.
- Offer ambiguous suggestions only from local dictionary data.
- Store settings with `chrome.storage`.
- Avoid external network requests.
- Avoid analytics.
- Avoid telemetry.
- Avoid remote error reporting.
- Avoid user accounts.

## Data that may be stored

Allowed:

- Global enabled state.
- Disabled domains.
- User custom correction pairs.
- User ignored words.
- Preferred locale.
- UI preferences.
- Minimal last-correction metadata.

Not allowed:

- Full sentences.
- Email or message bodies.
- Passwords.
- Form submissions.
- Clipboard history.
- Browsing history.
- Keystroke logs.
- Authentication tokens.

## Ambiguous suggestion UI

The ambiguous-suggestion popover must use only the completed word, local dictionary options, and the active editor context needed to replace that word. It must not store surrounding sentences or transmit suggestion choices.

## Sensitive field exclusions

Always exclude:

```text
input[type=password]
input[type=email]
input[type=url]
input[type=number]
input[type=tel]
input[type=date]
input[type=datetime-local]
input[type=month]
input[type=time]
input[type=week]
```

Also exclude fields that appear to contain:

- Credit-card data.
- Security codes.
- One-time passwords.
- API keys.
- Secret tokens.
- Code.
- Terminal input.

Heuristics must fail safely. When uncertain, do not correct.

## Permissions

Review every requested permission.

The likely MVP permission is:

```json
{
  "permissions": ["storage"]
}
```

Content scripts may require broad host matching to work across websites. Before publication, evaluate optional host permissions or user-triggered access.

Document why each permission is necessary in the Chrome Web Store listing.

## Content security

- Do not use `eval`.
- Do not load remote scripts.
- Do not use inline executable JavaScript where disallowed by Manifest V3.
- Do not inject untrusted HTML.
- Render user dictionary values with `textContent`.
- Validate imported settings.
- Limit imported file size.
- Reject malformed JSON.
- Prevent prototype pollution by using safe object handling.
- Treat dictionary keys such as `__proto__` and `constructor` as invalid.

## Message passing

Validate all messages between:

- Popup.
- Options page.
- Content scripts.
- Service worker.

Do not trust arbitrary page-provided data.

## Logging

Development logs must not include typed words, sentences, or element contents.

Production builds should avoid logging normal correction activity.

Allowed development log example:

```text
Correction applied from safe dictionary.
```

Disallowed:

```text
Corrected user email text: "Eu tambem..."
```

## Future cloud features

Any future API-based correction must be:

- Disabled by default.
- Explicitly opt-in.
- Clearly explained.
- Limited to the minimum necessary text.
- Protected in transit.
- Covered by a public privacy policy.
- Configurable per website.
- Disabled for sensitive fields.

The local safe-dictionary mode must remain available.
