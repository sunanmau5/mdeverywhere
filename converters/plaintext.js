import { stripMarkdown } from '../markdown-parser.js';

/**
 * @param {string} markdown
 * @returns {string}
 */
export function convertToPlainText(markdown) {
  return stripMarkdown(markdown);
}

