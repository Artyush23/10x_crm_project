import { getSession } from "./auth.js";

export function requireSession() {
  const session = getSession();

  if (!session) {
    window.location.href = "index.html";
    return null;
  }

  return session;
}

export function redirectAuthenticatedUser() {
  if (!getSession()) {
    return false;
  }

  window.location.href = "dashboard.html";
  return true;
}

