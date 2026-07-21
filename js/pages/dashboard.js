import { getSession, getUsers } from "../core/auth.js";
import { requireSession } from "../core/guard.js";
import { initializeTheme } from "../core/theme.js";
import { initializeNavigation } from "../core/navigation.js";

function getCurrentUser() {
  const session = getSession();

  if (!session) {
    return null;
  }

  return (
    getUsers().find((user) => Number(user.id) === Number(session.userId)) ?? null
  );
}

function initializeGreeting() {
  const user = getCurrentUser();
  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const greeting = document.querySelector("#page-title");

  greeting.textContent = firstName
    ? `Welcome back, ${firstName}!`
    : "Welcome back!";
}

function initializeClock() {
  const dateElement = document.querySelector("#current-date");
  const clockElement = document.querySelector("#live-clock");

  const updateClock = () => {
    const now = new Date();
    dateElement.dateTime = now.toISOString();
    dateElement.textContent = now.toLocaleDateString();
    clockElement.dateTime = now.toISOString();
    clockElement.textContent = now.toLocaleTimeString();
  };

  updateClock();
  window.setInterval(updateClock, 1000);
}

if (requireSession()) {
  initializeTheme();
  initializeNavigation();
  initializeGreeting();
  initializeClock();
}

