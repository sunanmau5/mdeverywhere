import {
  convertMarkdown,
  DEFAULT_PLATFORM,
  SUPPORTED_PLATFORMS,
} from "./index.js";

export const DEFAULT_STORAGE_KEY = "mdeverywhere";
export const DEFAULT_DEBOUNCE_MS = 300;
export const COPY_SUCCESS_TEXT = "Copied!";

/**
 * @template {(...args: any[]) => void} T
 * @param {T} func
 * @param {number} delay
 * @param {{ setTimeoutFn?: typeof setTimeout, clearTimeoutFn?: typeof clearTimeout }} [timers]
 * @returns {T}
 */
export function debounce(func, delay, timers = {}) {
  const setTimeoutFn = timers.setTimeoutFn ?? globalThis.setTimeout;
  const clearTimeoutFn = timers.clearTimeoutFn ?? globalThis.clearTimeout;
  let timeoutId;

  return /** @type {T} */ (
    function debounced(...args) {
      clearTimeoutFn(timeoutId);
      timeoutId = setTimeoutFn(() => {
        func.apply(this, args);
      }, delay);
    }
  );
}

/**
 * @param {object} [options]
 * @param {Document} [options.document]
 * @param {Window} [options.window]
 * @param {Navigator} [options.navigator]
 * @param {Storage} [options.localStorage]
 * @param {{ writeText?: (value: string) => Promise<void> }} [options.clipboard]
 * @param {string} [options.storageKey]
 * @param {number} [options.debounceMs]
 * @param {typeof setTimeout} [options.setTimeoutFn]
 * @param {typeof clearTimeout} [options.clearTimeoutFn]
 * @returns {{
 *   state: { currentPlatform: string, inputText: string, outputText: string },
 *   init: () => void,
 *   destroy: () => void,
 *   handleInput: (text: string) => void,
 *   changePlatform: (platform: string) => void,
 *   clearInput: () => void,
 *   copyToClipboard: () => Promise<boolean>,
 *   updateOutput: () => void,
 *   loadFromLocalStorage: () => void,
 *   saveToLocalStorage: () => void,
 *   switchPlatformByNumber: (index: number) => void
 * }}
 */
export function createMarkdownApp(options = {}) {
  const doc = options.document ?? globalThis.document;
  const win = options.window ?? globalThis.window;
  const nav = options.navigator ?? globalThis.navigator;
  const storage = options.localStorage ?? globalThis.localStorage;
  const clipboard = options.clipboard ?? nav?.clipboard;
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const setTimeoutFn = options.setTimeoutFn ?? globalThis.setTimeout;
  const clearTimeoutFn = options.clearTimeoutFn ?? globalThis.clearTimeout;

  if (!doc) {
    throw new Error("A document is required to create the browser app.");
  }

  const state = {
    currentPlatform: DEFAULT_PLATFORM,
    inputText: "",
    outputText: "",
  };

  /** @type {Array<() => void>} */
  const cleanupFns = [];
  let initialized = false;

  /**
   * @param {string} id
   * @returns {HTMLElement}
   */
  function getElement(id) {
    const element = doc.getElementById(id);

    if (!(element instanceof HTMLElement)) {
      throw new Error(`Missing required element: ${id}`);
    }

    return element;
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
    state.outputText = convertMarkdown(state.inputText, state.currentPlatform);
    renderOutput();
  }

  /**
   * @returns {void}
   */
  function renderOutput() {
    getElement("outputPreview").textContent = state.outputText;
  }

  /**
   * @param {string} platform
   * @returns {void}
   */
  function changePlatform(platform) {
    state.currentPlatform = SUPPORTED_PLATFORMS.includes(platform)
      ? platform
      : DEFAULT_PLATFORM;

    const selector = /** @type {HTMLSelectElement} */ (
      getElement("platformSelector")
    );
    selector.value = state.currentPlatform;

    updateOutput();
    saveToLocalStorage();
  }

  /**
   * @returns {void}
   */
  function clearInput() {
    state.inputText = "";
    const input = /** @type {HTMLTextAreaElement} */ (
      getElement("markdownInput")
    );
    input.value = "";
    updateOutput();
    updateCharCount();
    saveToLocalStorage();
  }

  /**
   * @returns {void}
   */
  function updateCharCount() {
    getElement("charCount").textContent =
      `${state.inputText.length.toLocaleString()} characters`;
  }

  /**
   * @returns {void}
   */
  function saveToLocalStorage() {
    if (!storage?.setItem) {
      return;
    }

    try {
      storage.setItem(
        storageKey,
        JSON.stringify({
          inputText: state.inputText,
          platform: state.currentPlatform,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  /**
   * @returns {void}
   */
  function loadFromLocalStorage() {
    if (!storage?.getItem) {
      updateOutput();
      return;
    }

    try {
      const rawData = storage.getItem(storageKey);

      if (!rawData) {
        updateOutput();
        return;
      }

      const data = JSON.parse(rawData);

      state.inputText =
        typeof data?.inputText === "string" ? data.inputText : "";
      state.currentPlatform = SUPPORTED_PLATFORMS.includes(data?.platform)
        ? data.platform
        : DEFAULT_PLATFORM;

      const input = /** @type {HTMLTextAreaElement} */ (
        getElement("markdownInput")
      );
      const selector = /** @type {HTMLSelectElement} */ (
        getElement("platformSelector")
      );
      input.value = state.inputText;
      selector.value = state.currentPlatform;
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
    }

    updateOutput();
  }

  /**
   * @returns {void}
   */
  function showCopySuccess() {
    const button = getElement("copyBtn");
    const originalText =
      button.dataset.originalText ?? button.textContent ?? "Copy";

    button.dataset.originalText = originalText;
    button.textContent = COPY_SUCCESS_TEXT;
    button.classList.add("success");

    setTimeoutFn(() => {
      button.textContent = originalText;
      button.classList.remove("success");
    }, 2000);
  }

  /**
   * @returns {boolean}
   */
  function fallbackCopy() {
    const output = getElement("outputPreview");
    const selection = win?.getSelection?.();
    const range = doc.createRange?.();

    if (!selection || !range || typeof doc.execCommand !== "function") {
      return false;
    }

    range.selectNodeContents(output);
    selection.removeAllRanges();
    selection.addRange(range);

    try {
      const copied = doc.execCommand("copy");

      if (copied !== false) {
        showCopySuccess();
        return true;
      }
    } catch (error) {
      console.error("Copy failed:", error);
    } finally {
      selection.removeAllRanges();
    }

    return false;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async function copyToClipboard() {
    if (clipboard?.writeText) {
      try {
        await clipboard.writeText(state.outputText);
        showCopySuccess();
        return true;
      } catch {
        return fallbackCopy();
      }
    }

    return fallbackCopy();
  }

  /**
   * @param {number} index
   * @returns {void}
   */
  function switchPlatformByNumber(index) {
    const selector = /** @type {HTMLSelectElement} */ (
      getElement("platformSelector")
    );
    const options = selector.options;

    if (index < 0 || index >= options.length) {
      return;
    }

    selector.selectedIndex = index;
    changePlatform(options[index].value);
  }

  /**
   * @returns {(event: KeyboardEvent) => void}
   */
  function createKeyboardHandler() {
    return function onKeydown(event) {
      const key = event.key.toLowerCase();
      const code = event.code ?? "";
      const isMac = nav?.platform?.toUpperCase().includes("MAC");
      const cmdCtrl = isMac ? event.metaKey : event.ctrlKey;

      if (key === "escape") {
        if (doc.activeElement instanceof HTMLElement) {
          doc.activeElement.blur();
        }
        return;
      }

      if (event.ctrlKey && event.shiftKey && key === "p") {
        event.preventDefault();
        getElement("platformSelector").focus();
        return;
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        (key === "backspace" || key === "delete")
      ) {
        event.preventDefault();
        clearInput();
        return;
      }

      if (event.altKey && /^Digit[1-9]$/.test(code)) {
        event.preventDefault();
        switchPlatformByNumber(Number.parseInt(code.slice(5), 10) - 1);
        return;
      }

      if (event.altKey && key >= "1" && key <= "9") {
        event.preventDefault();
        switchPlatformByNumber(Number.parseInt(key, 10) - 1);
        return;
      }

      if (cmdCtrl && key === "enter") {
        event.preventDefault();
        void copyToClipboard();
      }
    };
  }

  /**
   * @returns {void}
   */
  function setupEventListeners() {
    const input = /** @type {HTMLTextAreaElement} */ (
      getElement("markdownInput")
    );
    const selector = /** @type {HTMLSelectElement} */ (
      getElement("platformSelector")
    );
    const clearButton = getElement("clearBtn");
    const copyButton = getElement("copyBtn");

    const debouncedInputHandler = debounce(
      /** @param {Event} event */
      (event) => {
        const target = /** @type {HTMLTextAreaElement} */ (event.target);
        handleInput(target.value);
      },
      debounceMs,
      { setTimeoutFn, clearTimeoutFn },
    );

    const platformHandler = /** @param {Event} event */ (event) => {
      const target = /** @type {HTMLSelectElement} */ (event.target);
      changePlatform(target.value);
    };

    const clearHandler = () => {
      clearInput();
    };

    const copyHandler = () => {
      void copyToClipboard();
    };

    const keydownHandler = createKeyboardHandler();

    input.addEventListener("input", debouncedInputHandler);
    selector.addEventListener("change", platformHandler);
    clearButton.addEventListener("click", clearHandler);
    copyButton.addEventListener("click", copyHandler);
    doc.addEventListener("keydown", keydownHandler);

    cleanupFns.push(() =>
      input.removeEventListener("input", debouncedInputHandler),
    );
    cleanupFns.push(() =>
      selector.removeEventListener("change", platformHandler),
    );
    cleanupFns.push(() =>
      clearButton.removeEventListener("click", clearHandler),
    );
    cleanupFns.push(() => copyButton.removeEventListener("click", copyHandler));
    cleanupFns.push(() => doc.removeEventListener("keydown", keydownHandler));
  }

  /**
   * @returns {void}
   */
  function init() {
    if (initialized) {
      return;
    }

    loadFromLocalStorage();
    setupEventListeners();
    updateCharCount();
    initialized = true;
  }

  /**
   * @returns {void}
   */
  function destroy() {
    while (cleanupFns.length > 0) {
      cleanupFns.pop()?.();
    }

    initialized = false;
  }

  return {
    state,
    init,
    destroy,
    handleInput,
    changePlatform,
    clearInput,
    copyToClipboard,
    updateOutput,
    loadFromLocalStorage,
    saveToLocalStorage,
    switchPlatformByNumber,
  };
}

/**
 * @param {object} [options]
 * @param {Document} [options.document]
 * @returns {{ destroy: () => void } | ReturnType<typeof createMarkdownApp>}
 */
export function initBrowserApp(options = {}) {
  const doc = options.document ?? globalThis.document;

  if (!doc) {
    throw new Error("A document is required to initialize the browser app.");
  }

  if (doc.readyState === "loading") {
    /** @type {ReturnType<typeof createMarkdownApp> | null} */
    let app = null;

    const onReady = () => {
      doc.removeEventListener("DOMContentLoaded", onReady);
      app = createMarkdownApp(options);
      app.init();
    };

    doc.addEventListener("DOMContentLoaded", onReady);

    return {
      destroy() {
        doc.removeEventListener("DOMContentLoaded", onReady);
        app?.destroy();
      },
    };
  }

  const app = createMarkdownApp(options);
  app.init();
  return app;
}
