import { getSession, getUsers } from "../core/auth.js";
import { requireSession } from "../core/guard.js";
import { initializeTheme } from "../core/theme.js";
import { initializeNavigation } from "../core/navigation.js";

let users = [];
let currentUser = null;

function getInitials(fullName) {
  return String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatMemberSince(createdAt) {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}

function resolveCurrentUser() {
  const session = getSession();
  users = getUsers();
  currentUser =
    users.find((user) => Number(user.id) === Number(session?.userId)) ?? null;
  return currentUser;
}

function renderProfile(user) {
  document.querySelector("#profile-avatar").textContent =
    getInitials(user.fullName) || "?";
  document.querySelector("#profile-name").textContent = user.fullName;
  document.querySelector("#profile-full-name").textContent = user.fullName;
  document.querySelector("#profile-email").textContent = user.email;
  document.querySelector("#profile-company").textContent =
    user.company || "Not provided";
  document.querySelector("#profile-member-since").textContent =
    formatMemberSince(user.createdAt);

  const editForm = document.querySelector("#edit-profile-form");
  editForm.elements.fullName.value = user.fullName;
  editForm.elements.company.value = user.company || "";
}

function initializeProfilePage() {
  const user = resolveCurrentUser();

  if (!user) {
    console.error("Could not resolve the current profile user.");
    return;
  }

  renderProfile(user);
}

if (requireSession()) {
  initializeTheme();
  initializeNavigation();
  initializeProfilePage();
}

