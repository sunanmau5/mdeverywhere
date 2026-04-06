/**
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} text
 * @returns {string}
 */
export function stripMarkdown(text) {
  let result = String(text ?? "");

  result = result.replace(/```(\w+)?\n([\s\S]+?)```/g, "$2");
  result = result.replace(/^>\s?/gm, "");
  result = result.replace(/^#{1,6}\s+/gm, "");
  result = result.replace(/!\[(.*?)\]\((.*?)\)/g, "");
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, "$1");
  result = result.replace(/\*\*(.+?)\*\*/gs, "$1");
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/gs, "$1");
  result = result.replace(/(?<!_)_(?!_)(.+?)_(?!_)/gs, "$1");
  result = result.replace(/~~(.+?)~~/gs, "$1");
  result = result.replace(/`(.+?)`/gs, "$1");
  result = result.replace(/^[-*+]\s+/gm, "");

  return result;
}

/**
 * @param {string} text
 * @returns {{ text: string, escapeMap: Map<string, string> }}
 */
export function processEscapes(text) {
  const escapeMap = new Map();
  let counter = 0;

  const withPlaceholders = String(text ?? "").replace(
    /\\([*_~`[\]()#\-+.!\\])/g,
    (_match, character) => {
      const placeholder = `@@ESCAPE${counter}@@`;
      escapeMap.set(placeholder, character);
      counter += 1;
      return placeholder;
    },
  );

  return { text: withPlaceholders, escapeMap };
}

/**
 * @param {string} text
 * @param {Map<string, string>} escapeMap
 * @returns {string}
 */
export function restoreEscapes(text, escapeMap) {
  let result = text;

  escapeMap.forEach((value, key) => {
    result = result.replace(new RegExp(escapeRegex(key), "g"), value);
  });

  return result;
}

/**
 * @param {string} text
 * @param {{
 *   bold?: (content: string) => string,
 *   italic?: (content: string) => string,
 *   strikethrough?: (content: string) => string,
 *   code?: (content: string) => string,
 *   link?: (text: string, url: string) => string
 * }} [rules]
 * @returns {string}
 */
export function parseInline(text, rules = {}) {
  let result = text;

  if (rules.bold) {
    result = result.replace(/\*\*(.+?)\*\*/gs, (_match, content) =>
      rules.bold(content),
    );
  }

  if (rules.italic) {
    result = result.replace(
      /(?<!\*)\*(?!\*)(.+?)\*(?!\*)/gs,
      (_match, content) => rules.italic(content),
    );
    result = result.replace(/(?<!_)_(?!_)(.+?)_(?!_)/gs, (_match, content) =>
      rules.italic(content),
    );
  }

  if (rules.strikethrough) {
    result = result.replace(/~~(.+?)~~/gs, (_match, content) =>
      rules.strikethrough(content),
    );
  }

  if (rules.code) {
    result = result.replace(/`(.+?)`/gs, (_match, content) =>
      rules.code(content),
    );
  }

  if (rules.link) {
    result = result.replace(/\[(.+?)\]\((.+?)\)/gs, (_match, linkText, url) =>
      rules.link(linkText, url),
    );
  }

  return result;
}

/**
 * @param {string} text
 * @param {{
 *   heading?: (level: number, content: string) => string,
 *   codeBlock?: (code: string, language: string) => string,
 *   image?: (alt: string, url: string) => string
 * }} [rules]
 * @returns {string}
 */
export function parseBlocks(text, rules = {}) {
  let result = text;

  if (rules.heading) {
    result = result.replace(/^(#{1,6})\s+(.+)$/gm, (_match, hashes, content) =>
      rules.heading(hashes.length, content),
    );
  }

  if (rules.codeBlock) {
    result = result.replace(
      /```(\w*)\n([\s\S]+?)```/g,
      (_match, language, code) => rules.codeBlock(code, language),
    );
  }

  if (rules.image) {
    result = result.replace(/!\[(.+?)\]\((.+?)\)/g, (_match, alt, url) =>
      rules.image(alt, url),
    );
  }

  return result;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
