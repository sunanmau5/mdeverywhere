import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  COPY_SUCCESS_TEXT,
  createMarkdownApp,
  debounce,
  initBrowserApp,
} from "../src/browser-app.js";

function createMarkup() {
  document.body.innerHTML = `
    <div class="container">
      <select id="platformSelector">
        <option value="whatsapp">WhatsApp</option>
        <option value="slack">Slack</option>
        <option value="discord">Discord</option>
        <option value="telegram">Telegram</option>
        <option value="notion">Notion</option>
        <option value="github">GitHub</option>
        <option value="linkedin">LinkedIn</option>
        <option value="plaintext">Plain Text</option>
        <option value="html">HTML</option>
      </select>
      <textarea id="markdownInput"></textarea>
      <button id="clearBtn">Clear</button>
      <div id="charCount"></div>
      <div id="outputPreview"></div>
      <button id="copyBtn">Copy</button>
    </div>
  `;
}

describe("browser app", () => {
  beforeEach(() => {
    createMarkup();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("debounces calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced("first");
    debounced("second");

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("second");
  });

  test("hydrates from localStorage and renders output", () => {
    localStorage.setItem(
      "mdeverywhere",
      JSON.stringify({
        inputText: "**Bold**",
        platform: "slack",
      }),
    );

    const app = createMarkdownApp();
    app.init();

    expect(app.state.currentPlatform).toBe("slack");
    expect(document.getElementById("markdownInput").value).toBe("**Bold**");
    expect(document.getElementById("outputPreview").textContent).toBe("*Bold*");
    expect(document.getElementById("charCount").textContent).toBe(
      "8 characters",
    );
  });

  test("handles debounced input from DOM events", () => {
    vi.useFakeTimers();
    const app = createMarkdownApp();
    app.init();

    const input = document.getElementById("markdownInput");
    input.value = "**Bold**";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(app.state.inputText).toBe("");

    vi.advanceTimersByTime(300);

    expect(app.state.inputText).toBe("**Bold**");
    expect(document.getElementById("outputPreview").textContent).toBe("*Bold*");
  });

  test("changes platform and persists state", () => {
    const app = createMarkdownApp();
    app.init();
    app.handleInput("**Bold**");

    const selector = document.getElementById("platformSelector");
    selector.value = "plaintext";
    selector.dispatchEvent(new Event("change", { bubbles: true }));

    expect(app.state.currentPlatform).toBe("plaintext");
    expect(document.getElementById("outputPreview").textContent).toBe("Bold");
    expect(JSON.parse(localStorage.getItem("mdeverywhere")).platform).toBe(
      "plaintext",
    );
  });

  test("falls back to the default platform for invalid selections", () => {
    const app = createMarkdownApp();
    app.init();
    app.handleInput("**Bold**");

    app.changePlatform("invalid");

    expect(app.state.currentPlatform).toBe("whatsapp");
    expect(document.getElementById("platformSelector").value).toBe("whatsapp");
    expect(document.getElementById("outputPreview").textContent).toBe("*Bold*");
  });

  test("clears input from button and keyboard shortcut", () => {
    const app = createMarkdownApp();
    app.init();
    app.handleInput("**Bold**");

    document.getElementById("clearBtn").click();
    expect(document.getElementById("markdownInput").value).toBe("");
    expect(document.getElementById("outputPreview").textContent).toBe("");

    app.handleInput("**Bold**");
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        ctrlKey: true,
        shiftKey: true,
        key: "Backspace",
        bubbles: true,
      }),
    );
    expect(app.state.inputText).toBe("");
  });

  test("focuses selector and switches platforms with shortcuts", () => {
    const app = createMarkdownApp();
    app.init();

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        ctrlKey: true,
        shiftKey: true,
        key: "P",
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(
      document.getElementById("platformSelector"),
    );

    app.handleInput("**Bold**");
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        altKey: true,
        key: "@",
        code: "Digit2",
        bubbles: true,
      }),
    );
    expect(app.state.currentPlatform).toBe("slack");
    expect(document.getElementById("outputPreview").textContent).toBe("*Bold*");
  });

  test("copies with navigator clipboard on click", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const app = createMarkdownApp({ clipboard: { writeText } });
    app.init();
    app.handleInput("**Bold**");

    document.getElementById("copyBtn").click();
    await vi.runAllTimersAsync();

    expect(writeText).toHaveBeenCalledWith("*Bold*");
    expect(document.getElementById("copyBtn").textContent).toBe("Copy");
  });

  test("falls back to execCommand when clipboard write fails", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockRejectedValue(new Error("no clipboard"));
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });

    const app = createMarkdownApp({ clipboard: { writeText } });
    app.init();
    app.handleInput("**Bold**");

    const copied = await app.copyToClipboard();

    expect(copied).toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.getElementById("copyBtn").textContent).toBe(
      COPY_SUCCESS_TEXT,
    );

    await vi.advanceTimersByTimeAsync(2000);
    expect(document.getElementById("copyBtn").textContent).toBe("Copy");
  });

  test("returns false when no clipboard fallback is available", async () => {
    const app = createMarkdownApp({
      clipboard: {},
      window: { getSelection: () => null },
    });
    app.init();

    await expect(app.copyToClipboard()).resolves.toBe(false);
  });

  test("returns false when execCommand throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => {
        throw new Error("copy failed");
      }),
    });

    const app = createMarkdownApp({
      clipboard: {},
      window,
    });
    app.init();

    await expect(app.copyToClipboard()).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  test("copies with keyboard shortcut on mac and clears focus on escape", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const input = document.getElementById("markdownInput");
    const app = createMarkdownApp({
      clipboard: { writeText },
      navigator: { platform: "MacIntel" },
    });
    app.init();
    app.handleInput("**Bold**");

    input.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "Enter",
        metaKey: true,
      }),
    );

    await vi.runAllTimersAsync();
    expect(writeText).toHaveBeenCalledWith("*Bold*");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
    );
    expect(document.activeElement).not.toBe(input);
  });

  test("initBrowserApp initializes immediately when document is ready", () => {
    const app = initBrowserApp({ document });

    expect(document.getElementById("charCount").textContent).toBe(
      "0 characters",
    );
    app.destroy();
  });

  test("supports the deferred DOMContentLoaded initialization path", () => {
    const originalReadyState = document.readyState;
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "loading",
    });

    const appHandle = initBrowserApp({ document });
    expect(document.getElementById("charCount").textContent).toBe("");

    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.getElementById("charCount").textContent).toBe(
      "0 characters",
    );

    appHandle.destroy();
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: originalReadyState,
    });
  });

  test("covers no-document and storage edge cases", () => {
    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: undefined,
    });

    expect(() => createMarkdownApp()).toThrow(
      "A document is required to create the browser app.",
    );
    expect(() => initBrowserApp()).toThrow(
      "A document is required to initialize the browser app.",
    );

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const throwingStorage = {
      getItem: vi.fn(() => "{"),
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    const app = createMarkdownApp({ localStorage: throwingStorage });
    app.init();
    app.saveToLocalStorage();
    app.switchPlatformByNumber(99);
    app.init();

    expect(warnSpy).toHaveBeenCalled();
    expect(throwingStorage.setItem).toHaveBeenCalled();
  });

  test("covers storage no-op branches", () => {
    const app = createMarkdownApp({ localStorage: {} });
    app.init();
    app.saveToLocalStorage();
    app.loadFromLocalStorage();

    expect(document.getElementById("outputPreview").textContent).toBe("");
  });
});
