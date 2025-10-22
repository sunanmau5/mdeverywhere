import { processEscapes, restoreEscapes } from '../markdown-parser.js';

/**
 * @param {string} markdown
 * @returns {string}
 */
export function convertToNotion(markdown) {
  const { text, escapeMap } = processEscapes(markdown);
  let result = text;

  result = result.replace(/!\[.*?\]\(.*?\)/g, '');

  result = restoreEscapes(result, escapeMap);
  return result;
}

