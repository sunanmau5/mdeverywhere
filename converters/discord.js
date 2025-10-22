import { processEscapes, restoreEscapes } from '../markdown-parser.js';

/**
 * @param {string} markdown
 * @returns {string}
 */
export function convertToDiscord(markdown) {
  const { text, escapeMap } = processEscapes(markdown);
  let result = text;

  result = result.replace(/^#{1,6}\s+(.+)$/gm, '**$1**');
  result = result.replace(/!\[.*?\]\(.*?\)/g, '');

  result = restoreEscapes(result, escapeMap);
  return result;
}

