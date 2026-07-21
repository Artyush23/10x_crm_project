import { getSession, getUsers } from "../core/auth.js";
import { STORAGE_KEYS } from "../core/constants.js";
import { requireSession } from "../core/guard.js";
import { showToast } from "../core/notifications.js";
import { writeJSON } from "../core/storage.js";
import { initializeTheme } from "../core/theme.js";
import { initializeNavigation } from "../core/navigation.js";

let users = [];
let currentUser = null;

const PROFILE_ERRORS = Object.freeze({
  fullName: "Full name must be at least 3 characters",
  currentPassword: "Current password is incorrect",
  password:
    "Password must be at least 8 characters and contain a letter and a number",
  samePassword: "New password must be different from the current one",
  confirmPassword: "Passwords do not match",
});

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

function setFieldError(input, errorElement, message = "") {
  input.classList.toggle("input-error", Boolean(message));
  errorElement.textContent = message;

  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

function saveUsers() {
  writeJSON(STORAGE_KEYS.users, users);
}

function initializeEditProfileForm() {
  const form = document.querySelector("#edit-profile-form");
  const fullNameInput = form.elements.fullName;
  const fullNameError = document.querySelector("#profile-full-name-error");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = fullNameInput.value.trim();
    const company = form.elements.company.value.trim();
    const errorMessage =
      fullName.length < 3 ? PROFILE_ERRORS.fullName : "";
    setFieldError(fullNameInput, fullNameError, errorMessage);

    if (errorMessage) {
      fullNameInput.focus();
      return;
    }

    currentUser.fullName = fullName;
    currentUser.company = company;
    saveUsers();
    renderProfile(currentUser);
    showToast("Profile updated ✓");
  });
}

function isValidPassword(password) {
  return (
    password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
  );
}

function initializeChangePasswordForm() {
  const form = document.querySelector("#change-password-form");
  const fields = {
    currentPassword: form.elements.currentPassword,
    newPassword: form.elements.newPassword,
    confirmNewPassword: form.elements.confirmNewPassword,
  };
  const errorElements = {
    currentPassword: document.querySelector("#current-password-error"),
    newPassword: document.querySelector("#new-password-error"),
    confirmNewPassword: document.querySelector("#confirm-new-password-error"),
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const values = {
      currentPassword: fields.currentPassword.value,
      newPassword: fields.newPassword.value,
      confirmNewPassword: fields.confirmNewPassword.value,
    };
    const errors = {};

    if (values.currentPassword !== currentUser.password) {
      errors.currentPassword = PROFILE_ERRORS.currentPassword;
    }

    if (!isValidPassword(values.newPassword)) {
      errors.newPassword = PROFILE_ERRORS.password;
    } else if (values.newPassword === currentUser.password) {
      errors.newPassword = PROFILE_ERRORS.samePassword;
    }

    if (values.confirmNewPassword !== values.newPassword) {
      errors.confirmNewPassword = PROFILE_ERRORS.confirmPassword;
    }

    Object.keys(fields).forEach((fieldName) => {
      setFieldError(
        fields[fieldName],
        errorElements[fieldName],
        errors[fieldName],
      );
    });

    if (Object.keys(errors).length) {
      fields[Object.keys(errors)[0]].focus();
      return;
    }

    currentUser.password = values.newPassword;
    saveUsers();
    form.reset();
    showToast("Password changed ✓");
  });
}

function initializeProfilePage() {
  const user = resolveCurrentUser();

  if (!user) {
    console.error("Could not resolve the current profile user.");
    return;
  }

  renderProfile(user);
  initializeEditProfileForm();
  initializeChangePasswordForm();
}

if (requireSession()) {
  initializeTheme();
  initializeNavigation();
  initializeProfilePage();
}

