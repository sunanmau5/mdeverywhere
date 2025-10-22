# MDEverywhere

A simple, minimal web app that converts Markdown to platform-specific formatted text (WhatsApp, Slack, Discord, Telegram, and more) with keyboard shortcuts and one-click copy functionality.

## Features

- ✅ **8 Platform Support**: WhatsApp, Slack, Discord, Telegram, Notion, GitHub, LinkedIn, Plain Text, HTML
- ✅ **Real-time Conversion**: See output update as you type (debounced for performance)
- ✅ **Keyboard Shortcuts**: Fast platform switching and copying
- ✅ **Responsive Design**: Works on mobile, tablet, and desktop
- ✅ **LocalStorage**: Your input and platform preference are saved automatically
- ✅ **Zero Dependencies**: No external libraries, pure vanilla JavaScript
- ✅ **Accessible**: Keyboard navigation and screen reader friendly

## Getting Started

### Option 1: Using pnpm (Recommended)

Since this app uses ES6 modules, you need to run it through a local server:

```bash
# Start the development server
pnpm start

# Alternative
pnpm dev
```

Then open `http://localhost:8000` in your browser.

### Option 2: VS Code Live Server

If you're using VS Code, install the "Live Server" extension and click "Go Live" in the bottom right.

## Keyboard Shortcuts

- `Cmd/Ctrl + K` - Focus platform selector
- `Cmd/Ctrl + L` - Clear input
- `Cmd/Ctrl + C` - Copy output (when output is focused)
- `Cmd/Ctrl + 1-9` - Quick switch platforms (1=WhatsApp, 2=Slack, etc.)
- `Escape` - Clear focus

## Platform-Specific Formatting

### WhatsApp
- `**bold**` → `*bold*`
- `*italic*` → `_italic_`
- `~~strike~~` → `~strike~`
- Code blocks supported

### Slack
- `**bold**` → `*bold*`
- `*italic*` → `_italic_`
- `[link](url)` → `<url|link>`

### Discord
- Keeps standard markdown
- Headings converted to bold text

### Telegram
- Similar to WhatsApp
- Supports inline code and code blocks

### Notion, GitHub
- Full markdown support

### LinkedIn
- Basic formatting only (bold, italic)
- Tables and code blocks removed

### Plain Text
- All formatting stripped

### HTML
- Full HTML conversion

## Edge Cases Handled

- **Malformed syntax** → Treated as plain text
- **Unclosed delimiters** → Left as-is
- **Escaped characters** → `\*` becomes `*`
- **Empty input** → Shows placeholder
- **Unicode/emoji** → Preserved correctly

## File Structure

```
mdeverywhere/
├── index.html           # Main HTML structure
├── styles.css           # Responsive styling
├── app.js              # Core application logic
├── markdown-parser.js  # Utility functions
└── converters/         # Platform-specific converters
    ├── whatsapp.js
    ├── slack.js
    ├── discord.js
    ├── telegram.js
    ├── notion.js
    ├── github.js
    ├── linkedin.js
    ├── plaintext.js
    └── html.js
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Future Enhancements

- Dark mode toggle
- Export as file
- Import from file
- Preset templates
- Syntax highlighting
- PWA support

## License

MIT

