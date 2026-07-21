import { STORAGE_KEYS } from "./constants.js";
import { readJSON, removeStorageItem, writeJSON } from "./storage.js";

export function getUsers() {
  const users = readJSON(STORAGE_KEYS.users, []);
  return Array.isArray(users) ? users : [];
}

export function findUserByEmail(email) {
  const normalizedEmail = String(email).trim().toLowerCase();

  return (
    getUsers().find(
      (user) =>
        typeof user?.email === "string" &&
        user.email.toLowerCase() === normalizedEmail,
    ) ?? null
  );
}

export function registerUser({ fullName, email, password, company }) {
  const user = {
    id: Date.now(),
    fullName,
    email: email.toLowerCase(),
    password,
    company,
    createdAt: new Date().toISOString(),
  };

  writeJSON(STORAGE_KEYS.users, [...getUsers(), user]);
  return user;
}

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

