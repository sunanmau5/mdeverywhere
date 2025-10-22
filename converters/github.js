import { processEscapes, restoreEscapes } from '../markdown-parser.js';

/**
 * @param {string} markdown
 * @returns {string}
 */
export function convertToGitHub(markdown) {
  const { text, escapeMap } = processEscapes(markdown);
  const result = restoreEscapes(text, escapeMap);
  return result;
}

