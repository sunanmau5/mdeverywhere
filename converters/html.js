import { processEscapes, restoreEscapes } from '../markdown-parser.js';

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * @param {string} markdown
 * @returns {string}
 */
export function convertToHTML(markdown) {
  const { text, escapeMap } = processEscapes(markdown);
  let result = text;

  result = result.replace(/```(\w*)\n([\s\S]+?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });

  result = result.replace(/`(.+?)`/gs, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  result = result.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
  result = result.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
  result = result.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
  result = result.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  result = result.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  result = result.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');

  result = result.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  result = result.replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/gs, '<em>$1</em>');
  result = result.replace(/(?<!_)_(?!_)(.+?)_(?!_)/gs, '<em>$1</em>');
  result = result.replace(/~~(.+?)~~/gs, '<del>$1</del>');

  result = result.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  result = result.replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>');
  result = result.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  result = result.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  result = result.replace(/\n\n+/g, '</p><p>');
  result = result.replace(/^(.+)$/gm, (match) => {
    if (match.startsWith('<')) return match;
    return match;
  });

  result = restoreEscapes(result, escapeMap);
  return result;
}

