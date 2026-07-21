import { STORAGE_KEYS } from "./constants.js";
import { readJSON, removeStorageItem } from "./storage.js";

export function getSession() {
  const session = readJSON(STORAGE_KEYS.session, null);
  const hasValidUserId =
    session &&
    typeof session === "object" &&
    !Array.isArray(session) &&
    Number.isFinite(session.userId);

  return hasValidUserId ? session : null;
}

export function logout() {
  removeStorageItem(STORAGE_KEYS.session);
  window.location.href = "index.html";
}

