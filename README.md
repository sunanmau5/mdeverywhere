# MDEverywhere

MDEverywhere is an ESM-first Markdown conversion library with a small browser demo. It converts Markdown into platform-friendly text for WhatsApp, Slack, Discord, Telegram, Notion, GitHub, LinkedIn, plain text, and HTML.

## Repository Layout

- `src/` contains the publishable ESM library
- `demo/` contains the static browser demo used for local preview and GitHub Pages
- `test/` contains the automated test suite
- Root config files handle linting, tests, packaging, and workflows

## Install

```bash
pnpm install
pnpm dev
```

Open `http://localhost:8000/demo/`.

## Package Usage

```js
import { convertMarkdown, convertToSlack } from "@sunanmau5/mdeverywhere";

const markdown = "# Release Notes\n\n**Done** and _ready_.";

convertMarkdown(markdown, "whatsapp");
convertToSlack(markdown);
```

### Exported Entry Points

- `@sunanmau5/mdeverywhere`
- `@sunanmau5/mdeverywhere/browser-app`
- `@sunanmau5/mdeverywhere/markdown-parser`
- `@sunanmau5/mdeverywhere/converters/<name>`

## Supported Platforms

- WhatsApp
- Slack
- Discord
- Telegram
- Notion
- GitHub
- LinkedIn
- Plain Text
- HTML

## Development

```bash
pnpm lint
pnpm test
pnpm check
pnpm format
```

## Browser App Behavior

- Real-time conversion with a 300ms debounce
- Keyboard shortcuts: `Ctrl+Shift+P` focus platform, `Ctrl+Shift+Backspace` clear, `Alt+1..9` quick switch, `Cmd/Ctrl+Enter` copy
- LocalStorage persistence of the latest input and selected platform
- Clipboard copy with a DOM selection fallback when `navigator.clipboard` is unavailable

## Release Flow

- Pushes and pull requests run CI checks.
- Pushes to `main` deploy the static demo to GitHub Pages.
- Version tags like `v0.1.0` publish the npm package after verification passes.

## Manual Test Samples

The repository includes `demo/test-samples.md` for quick manual spot checks in the demo app, but the primary quality gate is the automated test suite.

## License

MIT
