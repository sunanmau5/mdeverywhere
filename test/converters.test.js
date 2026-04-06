import { describe, expect, test } from "vitest";

import {
  convertMarkdown,
  convertToDiscord,
  convertToGitHub,
  convertToHTML,
  convertToLinkedIn,
  convertToNotion,
  convertToPlainText,
  convertToSlack,
  convertToTelegram,
  convertToWhatsApp,
  getConverter,
} from "../src/index.js";

describe("converter exports", () => {
  test("falls back to plaintext for unknown platforms", () => {
    expect(getConverter("unknown")).toBe(convertToPlainText);
    expect(convertMarkdown("**Bold**", "unknown")).toBe("Bold");
    expect(convertMarkdown("**Bold**")).toBe("*Bold*");
  });

  test("converts markdown for WhatsApp", () => {
    expect(convertToWhatsApp("**Bold** *italic* ~~gone~~")).toBe(
      "*Bold* _italic_ ~gone~",
    );
    expect(convertToWhatsApp("- Item\n[Docs](https://example.com)")).toBe(
      "• Item\nDocs (https://example.com)",
    );
  });

  test("converts markdown for Slack", () => {
    expect(convertToSlack("# Heading\n**Bold** *italic* ~~gone~~")).toBe(
      "*Heading*\n*Bold* _italic_ ~gone~",
    );
    expect(convertToSlack("[Docs](https://example.com)")).toBe(
      "<https://example.com|Docs>",
    );
  });

  test("converts markdown for Discord", () => {
    expect(
      convertToDiscord(
        "# Heading\n![alt](https://example.com/image.png)\nBody",
      ),
    ).toBe("**Heading**\n\nBody");
  });

  test("keeps GitHub markdown unchanged other than escapes", () => {
    expect(convertToGitHub("\\*literal\\* and **bold**")).toBe(
      "*literal* and **bold**",
    );
  });

  test("converts markdown for Telegram", () => {
    expect(
      convertToTelegram("# Heading\n- Item\n[Docs](https://example.com)"),
    ).toBe("Heading\n• Item\nDocs (https://example.com)");
  });

  test("converts markdown for LinkedIn", () => {
    expect(convertToLinkedIn("**Bold** *italic* ~~gone~~\n- Item")).toBe(
      "*Bold* _italic_ gone\n• Item",
    );
  });

  test("drops only unsupported images for Notion", () => {
    expect(
      convertToNotion("Text\n![alt](https://example.com/image.png)\n**Bold**"),
    ).toBe("Text\n\n**Bold**");
  });

  test("strips formatting for plain text", () => {
    expect(
      convertToPlainText(
        "# Heading\n**Bold** _italic_ [Docs](https://example.com)",
      ),
    ).toBe("Heading\nBold italic Docs");
  });

  test("renders structured HTML output", () => {
    expect(
      convertToHTML(
        "# Title\n\nParagraph with **bold** and [Docs](https://example.com).\n\n- One\n- Two\n\n1. First\n2. Second\n\n> Quote\n\n```js\nconst value = 1 < 2;\n```",
      ),
    ).toBe(
      '<h1>Title</h1>\n<p>Paragraph with <strong>bold</strong> and <a href="https://example.com">Docs</a>.</p>\n<ul><li>One</li><li>Two</li></ul>\n<ol><li>First</li><li>Second</li></ol>\n<blockquote>Quote</blockquote>\n<pre><code class="language-js">const value = 1 &lt; 2;</code></pre>',
    );
  });

  test("preserves escaped characters through HTML conversion", () => {
    expect(convertToHTML("\\*literal\\* and `code`")).toBe(
      "<p>*literal* and <code>code</code></p>",
    );
  });

  test("renders inline images, mixed lists, and untyped code blocks in HTML", () => {
    expect(
      convertToHTML(
        "![Alt](https://example.com/image.png)\n\n- One\n1. Two\n\n```\n<script>alert(1)</script>\n```",
      ),
    ).toBe(
      '<p><img src="https://example.com/image.png" alt="Alt" /></p>\n<ul><li>One</li></ul>\n<ol><li>Two</li></ol>\n<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>',
    );
  });
});
