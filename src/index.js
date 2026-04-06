import { convertToDiscord } from "./converters/discord.js";
import { convertToGitHub } from "./converters/github.js";
import { convertToHTML } from "./converters/html.js";
import { convertToLinkedIn } from "./converters/linkedin.js";
import { convertToNotion } from "./converters/notion.js";
import { convertToPlainText } from "./converters/plaintext.js";
import { convertToSlack } from "./converters/slack.js";
import { convertToTelegram } from "./converters/telegram.js";
import { convertToWhatsApp } from "./converters/whatsapp.js";

export { convertToDiscord } from "./converters/discord.js";
export { convertToGitHub } from "./converters/github.js";
export { convertToHTML } from "./converters/html.js";
export { convertToLinkedIn } from "./converters/linkedin.js";
export { convertToNotion } from "./converters/notion.js";
export { convertToPlainText } from "./converters/plaintext.js";
export { convertToSlack } from "./converters/slack.js";
export { convertToTelegram } from "./converters/telegram.js";
export { convertToWhatsApp } from "./converters/whatsapp.js";
export * from "./markdown-parser.js";

export const DEFAULT_PLATFORM = "whatsapp";

export const converters = Object.freeze({
  whatsapp: convertToWhatsApp,
  slack: convertToSlack,
  discord: convertToDiscord,
  telegram: convertToTelegram,
  notion: convertToNotion,
  github: convertToGitHub,
  linkedin: convertToLinkedIn,
  plaintext: convertToPlainText,
  html: convertToHTML,
});

export const SUPPORTED_PLATFORMS = Object.freeze(Object.keys(converters));

/**
 * @param {string} platform
 * @returns {(markdown: string) => string}
 */
export function getConverter(platform) {
  return converters[platform] ?? converters.plaintext;
}

/**
 * @param {string} markdown
 * @param {string} [platform]
 * @returns {string}
 */
export function convertMarkdown(markdown, platform = DEFAULT_PLATFORM) {
  return getConverter(platform)(String(markdown ?? ""));
}
