import { processEscapes, restoreEscapes } from '../markdown-parser.js';

/**
 * @param {string} markdown
 * @returns {string}
 */
export function convertToWhatsApp(markdown) {
  const { text, escapeMap } = processEscapes(markdown);
  let result = text;

  result = result.replace(/\*\*(.+?)\*\*/gs, '*$1*');
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/gs, '_$1_');
  result = result.replace(/~~(.+?)~~/gs, '~$1~');

  result = result.replace(/^#{1,6}\s+/gm, '');
  result = result.replace(/!\[.*?\]\(.*?\)/g, '');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');

  result = result.replace(/^>\s+/gm, '');
  result = result.replace(/^[-*+]\s+/gm, '• ');
  result = result.replace(/^\d+\.\s+/gm, (match) => match);

  result = restoreEscapes(result, escapeMap);
  return result;
}

