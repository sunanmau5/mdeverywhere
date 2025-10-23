import { convertToWhatsApp } from './converters/whatsapp.js';
import { convertToSlack } from './converters/slack.js';
import { convertToDiscord } from './converters/discord.js';
import { convertToTelegram } from './converters/telegram.js';
import { convertToNotion } from './converters/notion.js';
import { convertToGitHub } from './converters/github.js';
import { convertToLinkedIn } from './converters/linkedin.js';
import { convertToPlainText } from './converters/plaintext.js';
import { convertToHTML } from './converters/html.js';

const state = {
  currentPlatform: 'whatsapp',
  inputText: '',
  outputText: ''
};

const converterFactory = {
  whatsapp: convertToWhatsApp,
  slack: convertToSlack,
  discord: convertToDiscord,
  telegram: convertToTelegram,
  notion: convertToNotion,
  github: convertToGitHub,
  linkedin: convertToLinkedIn,
  plaintext: convertToPlainText,
  html: convertToHTML
};

/**
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * @param {string} platform
 * @returns {Function}
 */
function getConverter(platform) {
  return converterFactory[platform] || converterFactory.plaintext;
}

/**
 * @returns {void}
 */
function initApp() {
  loadFromLocalStorage();
  setupEventListeners();
  setupKeyboardShortcuts();
  updateCharCount();
}

/**
 * @returns {void}
 */
function setupEventListeners() {
  const inputTextarea = document.getElementById('markdownInput');
  const platformSelector = document.getElementById('platformSelector');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');

  inputTextarea.addEventListener('input', debounce((e) => {
    handleInput(e.target.value);
  }, 300));

  platformSelector.addEventListener('change', (e) => {
    changePlatform(e.target.value);
  });

  clearBtn.addEventListener('click', clearInput);
  copyBtn.addEventListener('click', copyToClipboard);
}

/**
 * @param {string} text
 * @returns {void}
 */
function handleInput(text) {
  state.inputText = text;
  updateOutput();
  saveToLocalStorage();
  updateCharCount();
}

/**
 * @returns {void}
 */
function updateOutput() {
  const converter = getConverter(state.currentPlatform);
  state.outputText = converter(state.inputText);
  renderOutput();
}

/**
 * @returns {void}
 */
function renderOutput() {
  const outputPreview = document.getElementById('outputPreview');
  outputPreview.textContent = state.outputText;
}

/**
 * @param {string} newPlatform
 * @returns {void}
 */
function changePlatform(newPlatform) {
  state.currentPlatform = newPlatform;
  updateOutput();
  saveToLocalStorage();
}

/**
 * @returns {Promise<void>}
 */
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(state.outputText);
    showCopySuccess();
  } catch (err) {
    fallbackCopy();
  }
}

/**
 * @returns {void}
 */
function showCopySuccess() {
  const btn = document.getElementById('copyBtn');
  const originalText = btn.textContent;
  btn.textContent = '✓ Copied!';
  btn.classList.add('success');

  setTimeout(() => {
    btn.textContent = originalText;
    btn.classList.remove('success');
  }, 2000);
}

/**
 * @returns {void}
 */
function fallbackCopy() {
  const output = document.getElementById('outputPreview');
  const range = document.createRange();
  range.selectNodeContents(output);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    document.execCommand('copy');
    showCopySuccess();
  } catch (err) {
    console.error('Copy failed:', err);
  }

  selection.removeAllRanges();
}

/**
 * @returns {void}
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === 'Escape') {
      document.activeElement.blur();
      return;
    }

    // alt/option + p: focus platform selector
    if (e.altKey && e.key === 'p') {
      e.preventDefault();
      document.getElementById('platformSelector').focus();
      return;
    }

    // alt/option + c: clear input
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      clearInput();
      return;
    }

    // alt/option + 1-9: quick platform switch
    if (e.altKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      switchPlatformByNumber(parseInt(e.key) - 1);
      return;
    }

    // cmd/ctrl + enter: copy output
    if (cmdCtrl && e.key === 'Enter') {
      e.preventDefault();
      copyToClipboard();
      return;
    }
  });
}

/**
 * @param {number} index
 * @returns {void}
 */
function switchPlatformByNumber(index) {
  const platformSelector = document.getElementById('platformSelector');
  const options = platformSelector.options;

  if (index >= 0 && index < options.length) {
    platformSelector.selectedIndex = index;
    changePlatform(options[index].value);
  }
}

/**
 * @returns {void}
 */
function clearInput() {
  state.inputText = '';
  document.getElementById('markdownInput').value = '';
  updateOutput();
  updateCharCount();
  saveToLocalStorage();
}

/**
 * @returns {void}
 */
function updateCharCount() {
  const count = state.inputText.length;
  const charCountElement = document.getElementById('charCount');
  charCountElement.textContent = `${count.toLocaleString()} characters`;
}

/**
 * @returns {void}
 */
function saveToLocalStorage() {
  try {
    const data = {
      inputText: state.inputText,
      platform: state.currentPlatform,
      timestamp: Date.now()
    };
    localStorage.setItem('mdeverywhere', JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

/**
 * @returns {void}
 */
function loadFromLocalStorage() {
  try {
    const data = JSON.parse(localStorage.getItem('mdeverywhere'));
    if (data) {
      state.inputText = data.inputText || '';
      state.currentPlatform = data.platform || 'whatsapp';

      document.getElementById('markdownInput').value = state.inputText;
      document.getElementById('platformSelector').value = state.currentPlatform;
      updateOutput();
    }
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

