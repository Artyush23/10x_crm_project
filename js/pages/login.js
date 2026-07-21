import { redirectAuthenticatedUser } from "../core/guard.js";
import { initializeTheme } from "../core/theme.js";

if (!redirectAuthenticatedUser()) {
  initializeTheme();
}

