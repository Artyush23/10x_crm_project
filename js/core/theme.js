import { STORAGE_KEYS, THEMES } from "./constants.js";
import { createIcon } from "./icons.js";
import { readString, writeString } from "./storage.js";

const SUPPORTED_THEMES = new Set(Object.values(THEMES));

export function normalizeTheme(theme) {
  return SUPPORTED_THEMES.has(theme) ? theme : THEMES.light;
}

export function getCurrentTheme() {
  return normalizeTheme(document.documentElement.dataset.theme);
}

export function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);
  document.documentElement.dataset.theme = normalizedTheme;
  return normalizedTheme;
}

export function initializeTheme() {
  const storedTheme = readString(STORAGE_KEYS.theme, THEMES.light);
  return applyTheme(storedTheme);
}

export function updateThemeToggle(button, theme = getCurrentTheme()) {
  if (!button) {
    return;
  }

  const isDark = theme === THEMES.dark;
  const nextTheme = isDark ? THEMES.light : THEMES.dark;
  const icon = button.querySelector("[data-theme-icon]");
  const label = button.querySelector("[data-theme-label]");

  button.setAttribute("aria-pressed", String(isDark));
  button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
  button.title = `Switch to ${nextTheme} theme`;

  if (icon) {
    icon.replaceChildren(createIcon(isDark ? "moon" : "sun"));
  }

  if (label) {
    label.textContent = `${isDark ? "Dark" : "Light"} mode`;
  }
}

export function toggleTheme() {
  const nextTheme =
    getCurrentTheme() === THEMES.dark ? THEMES.light : THEMES.dark;

  writeString(STORAGE_KEYS.theme, nextTheme);
  applyTheme(nextTheme);
  document
    .querySelectorAll("[data-theme-toggle]")
    .forEach((button) => updateThemeToggle(button, nextTheme));

  return nextTheme;
}

export function bindThemeToggle(button) {
  if (!button) {
    return;
  }

  updateThemeToggle(button);
  button.addEventListener("click", toggleTheme);
}

