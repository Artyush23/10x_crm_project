import { STORAGE_KEYS } from "./constants.js";
import { removeStorageItem } from "./storage.js";

export function logout() {
  removeStorageItem(STORAGE_KEYS.session);
  window.location.href = "index.html";
}

