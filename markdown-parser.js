/**
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} text
 * @returns {string}
 */
export function stripMarkdown(text) {
  let result = text;

  result = result.replace(/^#{1,6}\s+/gm, '');
  result = result.replace(/!\[.*?\]\(.*?\)/g, '');
  result = result.replace(/\[(.+?)\]\(.*?\)/g, '$1');
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/_(.+?)_/g, '$1');
  result = result.replace(/~~(.+?)~~/g, '$1');
  result = result.replace(/`(.+?)`/g, '$1');
  result = result.replace(/^[>\-*+]\s+/gm, '');

  return result;
}

/**
 * @param {string} text
 * @returns {{text: string, escapeMap: Map<string, string>}}
 */
export function processEscapes(text) {
  const escapeMap = new Map();
  let counter = 0;

  const withPlaceholders = text.replace(/\\([*_~`[\]()#\-+.!\\])/g, (match, char) => {
    const placeholder = `__ESCAPE_${counter}__`;
    escapeMap.set(placeholder, char);
    counter++;
    return placeholder;
  });

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
    result = result.replace(new RegExp(key, 'g'), value);
  });
  return result;
}

/**
 * @param {string} text
 * @param {Object} rules
 * @returns {string}
 */
export function parseInline(text, rules) {
  let result = text;

  if (rules.bold) {
    result = result.replace(/\*\*(.+?)\*\*/gs, (match, content) => {
      return rules.bold(content);
    });
  }

  if (rules.italic) {
    result = result.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/gs, (match, content) => {
      return rules.italic(content);
    });
    result = result.replace(/(?<!_)_(?!_)(.+?)_(?!_)/gs, (match, content) => {
      return rules.italic(content);
    });
  }

  if (rules.strikethrough) {
    result = result.replace(/~~(.+?)~~/gs, (match, content) => {
      return rules.strikethrough(content);
    });
  }

  if (rules.code) {
    result = result.replace(/`(.+?)`/gs, (match, content) => {
      return rules.code(content);
    });
  }

  if (rules.link) {
    result = result.replace(/\[(.+?)\]\((.+?)\)/gs, (match, text, url) => {
      return rules.link(text, url);
    });
  }

  return result;
}

/**
 * @param {string} text
 * @param {Object} rules
 * @returns {string}
 */
export function parseBlocks(text, rules) {
  let result = text;

  if (rules.heading) {
    result = result.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      return rules.heading(hashes.length, content);
    });
  }

  if (rules.codeBlock) {
    result = result.replace(/```(\w*)\n([\s\S]+?)```/g, (match, lang, code) => {
      return rules.codeBlock(code, lang);
    });
  }

  if (rules.image) {
    result = result.replace(/!\[(.+?)\]\((.+?)\)/g, (match, alt, url) => {
      return rules.image(alt, url);
    });
  }

  return result;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

