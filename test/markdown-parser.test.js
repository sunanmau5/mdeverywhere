import { describe, expect, test } from "vitest";

import {
  escapeRegex,
  isValidUrl,
  parseBlocks,
  parseInline,
  processEscapes,
  restoreEscapes,
  stripMarkdown,
} from "../src/markdown-parser.js";

describe("markdown parser helpers", () => {
  test("escapes regular expression characters", () => {
    expect(escapeRegex("[test](value)+")).toBe("\\[test\\]\\(value\\)\\+");
  });

  test("strips common markdown syntax", () => {
    expect(
      stripMarkdown(
        "> # Title\n\n**Bold** and `code`\n\n```js\nconst x = 1;\n```",
      ),
    ).toBe("Title\n\nBold and code\n\nconst x = 1;\n");
  });

  test("processes and restores escaped markdown characters", () => {
    const processed = processEscapes("\\*bold\\* \\[link\\]");

    expect(processed.text).toContain("@@ESCAPE0@@");
    expect(restoreEscapes(processed.text, processed.escapeMap)).toBe(
      "*bold* [link]",
    );
  });

  test("handles nullish parser input and no-op parsing rules", () => {
    expect(stripMarkdown(null)).toBe("");
    expect(processEscapes(null).text).toBe("");
    expect(parseInline("plain text")).toBe("plain text");
    expect(parseBlocks("# Title")).toBe("# Title");
  });

  test("parses inline rules selectively", () => {
    expect(
      parseInline(
        "**Bold** and *italic* and `code` and [Docs](https://example.com)",
        {
          bold: (content) => `<b>${content}</b>`,
          italic: (content) => `<i>${content}</i>`,
          code: (content) => `<code>${content}</code>`,
          link: (text, url) => `<a href="${url}">${text}</a>`,
        },
      ),
    ).toBe(
      '<b>Bold</b> and <i>italic</i> and <code>code</code> and <a href="https://example.com">Docs</a>',
    );
  });

  test("parses underscore italics and strikethrough", () => {
    expect(
      parseInline("_italic_ and ~~gone~~", {
        italic: (content) => `<i>${content}</i>`,
        strikethrough: (content) => `<s>${content}</s>`,
      }),
    ).toBe("<i>italic</i> and <s>gone</s>");
  });

  test("parses block rules selectively", () => {
    expect(
      parseBlocks(
        "# Title\n\n![Alt](https://example.com/image.png)\n\n```js\nconst x = 1;\n```",
        {
          heading: (level, content) => `<h${level}>${content}</h${level}>`,
          image: (alt, url) => `<img src="${url}" alt="${alt}" />`,
          codeBlock: (code, language) =>
            `<pre data-lang="${language}">${code}</pre>`,
        },
      ),
    ).toBe(
      '<h1>Title</h1>\n\n<img src="https://example.com/image.png" alt="Alt" />\n\n<pre data-lang="js">const x = 1;\n</pre>',
    );
  });

  test("validates URLs", () => {
    expect(isValidUrl("https://example.com/docs")).toBe(true);
    expect(isValidUrl("notaurl")).toBe(false);
  });
});
