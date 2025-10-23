# MDEverywhere

Convert Markdown to platform-specific text formats. Supports WhatsApp, Slack, Discord, Telegram, Notion, GitHub, LinkedIn, Plain Text, and HTML.

## Installation

```bash
pnpm install
pnpm start
```

Open `http://localhost:8000`

## Features

- Real-time conversion with 300ms debounce
- 9 platform converters
- Keyboard shortcuts (Alt+P, Alt+C, Alt+1-9, Cmd/Ctrl+Enter)
- LocalStorage persistence
- Zero external dependencies

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + P` | Focus platform selector |
| `Alt + C` | Clear input |
| `Alt + 1-9` | Quick switch to platform (1=WhatsApp, 2=Slack, etc.) |
| `Cmd/Ctrl + Enter` | Copy output to clipboard |
| `Escape` | Clear focus |

## Architecture

Pure vanilla JavaScript with ES6 modules. No build tools required.

```
mdeverywhere/
├── index.html              # Main HTML with semantic markup
├── styles.css              # Responsive CSS Grid layout
├── app.js                  # Core logic, state, factory pattern
├── markdown-parser.js      # Shared utilities for parsing
└── converters/             # Platform-specific converters
    ├── whatsapp.js
    ├── slack.js
    ├── discord.js
    └── ...
```

### Converter Pattern

Each converter exports a single function that transforms markdown strings:

```javascript
import { processEscapes, restoreEscapes } from "../markdown-parser.js";

/**
 * @param {string} markdown
 * @returns {string}
 */
export function convertToPlatform(markdown) {
  const { text, escapeMap } = processEscapes(markdown);
  let result = text;

  // platform-specific transformations

  result = restoreEscapes(result, escapeMap);
  return result;
}
```

Converters are registered in the factory pattern in `app.js`:

```javascript
const converterFactory = {
  platform: convertToPlatform
  // ...
};
```

## Edge Case Handling

- Malformed syntax: treated as plain text
- Unclosed delimiters: preserved as literals
- Escaped characters: honored via `processEscapes()`
- Empty input: returns empty string
- Unicode/emoji: preserved

## Testing

Use `test-samples.md` for manual testing:

```bash
# Test basic formatting (bold, italic, code, links)
# Test edge cases (unclosed delimiters, escaped chars, nested formatting)
# Test unicode and emoji support
# Test platform-specific conversions
# Test performance with large inputs (10K+ chars)
```

## Contributing

### Adding a New Platform

1. Create `converters/platform.js`:

```javascript
import { processEscapes, restoreEscapes } from "../markdown-parser.js";

export function convertToPlatform(markdown) {
  const { text, escapeMap } = processEscapes(markdown);
  // implement conversion logic
  return restoreEscapes(text, escapeMap);
}
```

2. Register in `app.js`:

```javascript
import { convertToPlatform } from "./converters/platform.js";

const converterFactory = {
  // ...
  platform: convertToPlatform
};
```

3. Add option to `index.html`:

```html
<option value="platform">Platform Name</option>
```

### Code Style

- JSDoc comments for exported functions
- Lowercase inline comments
- Factory pattern for multiple implementations
- Use `const` over `let` when values don't change

### Package Manager

Use `pnpm` exclusively for this project.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT
