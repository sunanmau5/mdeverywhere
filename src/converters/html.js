import {
  parseInline,
  processEscapes,
  restoreEscapes,
} from "../markdown-parser.js";

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  const htmlEscapes = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}

/**
 * @param {string} value
 * @returns {string}
 */
function renderInline(value) {
  const escaped = escapeHtml(value);
  const withImages = escaped.replace(
    /!\[(.+?)\]\((.+?)\)/g,
    (_match, alt, url) => `<img src="${url}" alt="${alt}" />`,
  );

  return parseInline(withImages, {
    bold: (content) => `<strong>${content}</strong>`,
    italic: (content) => `<em>${content}</em>`,
    strikethrough: (content) => `<del>${content}</del>`,
    code: (content) => `<code>${escapeHtml(content)}</code>`,
    link: (text, url) => `<a href="${url}">${text}</a>`,
  });
}

/**
 * @param {string} markdown
 * @returns {string}
 */
export function convertToHTML(markdown) {
  const { text, escapeMap } = processEscapes(markdown);
  /** @type {Map<string, string>} */
  const codeBlockMap = new Map();
  let codeBlockIndex = 0;

  const codeBlockText = text.replace(
    /```([^\n`]*)\n([\s\S]+?)```/g,
    (_match, language, code) => {
      const normalizedLanguage = language.trim();
      const className = normalizedLanguage
        ? ` class="language-${escapeHtml(normalizedLanguage)}"`
        : "";
      const placeholder = `@@CODEBLOCK${codeBlockIndex}@@`;

      codeBlockMap.set(
        placeholder,
        `<pre><code${className}>${escapeHtml(code.trim())}</code></pre>`,
      );
      codeBlockIndex += 1;

      return placeholder;
    },
  );

  const lines = codeBlockText.split("\n");
  /** @type {string[]} */
  const output = [];
  /** @type {string[]} */
  let paragraph = [];
  /** @type {string[]} */
  let quote = [];
  /** @type {"ul" | "ol" | null} */
  let listType = null;
  /** @type {string[]} */
  let listItems = [];

  /**
   * @returns {void}
   */
  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }

    output.push(
      `<p>${paragraph.map((line) => renderInline(line)).join("<br />")}</p>`,
    );
    paragraph = [];
  }

  /**
   * @returns {void}
   */
  function flushQuote() {
    if (quote.length === 0) {
      return;
    }

    output.push(
      `<blockquote>${quote.map((line) => renderInline(line)).join("<br />")}</blockquote>`,
    );
    quote = [];
  }

  /**
   * @returns {void}
   */
  function flushList() {
    if (!listType || listItems.length === 0) {
      listType = null;
      listItems = [];
      return;
    }

    output.push(`<${listType}>${listItems.join("")}</${listType}>`);
    listType = null;
    listItems = [];
  }

  /**
   * @returns {void}
   */
  function flushBlocks() {
    flushParagraph();
    flushQuote();
    flushList();
  }

  for (const line of lines) {
    if (codeBlockMap.has(line)) {
      flushBlocks();
      output.push(codeBlockMap.get(line));
      continue;
    }

    if (line.trim() === "") {
      flushBlocks();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      flushBlocks();
      const [, hashes, content] = headingMatch;
      output.push(
        `<h${hashes.length}>${renderInline(content)}</h${hashes.length}>`,
      );
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);

    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    const unorderedMatch = line.match(/^[-*+]\s+(.+)$/);

    if (unorderedMatch) {
      flushParagraph();
      flushQuote();

      if (listType && listType !== "ul") {
        flushList();
      }

      listType = "ul";
      listItems.push(`<li>${renderInline(unorderedMatch[1])}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);

    if (orderedMatch) {
      flushParagraph();
      flushQuote();

      if (listType && listType !== "ol") {
        flushList();
      }

      listType = "ol";
      listItems.push(`<li>${renderInline(orderedMatch[1])}</li>`);
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line);
  }

  flushBlocks();

  return restoreEscapes(output.join("\n"), escapeMap);
}
