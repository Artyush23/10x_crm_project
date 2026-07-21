import { requireSession } from "../core/guard.js";
import { initializeTheme } from "../core/theme.js";
import { initializeNavigation } from "../core/navigation.js";

if (requireSession()) {
  initializeTheme();
  initializeNavigation();
}

