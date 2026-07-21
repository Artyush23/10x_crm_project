import { redirectAuthenticatedUser } from "../core/guard.js";
import { STORAGE_KEYS } from "../core/constants.js";
import { readJSON } from "../core/storage.js";
import { initializeTheme } from "../core/theme.js";

const SIGNUP_ERRORS = Object.freeze({
  fullName: "Full name must be at least 3 characters",
  email: "Please enter a valid email address",
  duplicateEmail: "An account with this email already exists",
  password:
    "Password must be at least 8 characters and contain a letter and a number",
  confirmPassword: "Passwords do not match",
});

function getStoredUsers() {
  const users = readJSON(STORAGE_KEYS.users, []);
  return Array.isArray(users) ? users : [];
}

function isValidEmail(email) {
  const atIndex = email.indexOf("@");
  const dotIndex = email.indexOf(".", atIndex + 1);

  return (
    atIndex > 0 &&
    dotIndex > atIndex + 1 &&
    dotIndex < email.length - 1
  );
}

function isValidPassword(password) {
  return (
    password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
  );
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

function validateSignup(values, users) {
  const errors = {};

  if (values.fullName.length < 3) {
    errors.fullName = SIGNUP_ERRORS.fullName;
  }

  if (!isValidEmail(values.email)) {
    errors.email = SIGNUP_ERRORS.email;
  } else if (
    users.some(
      (user) =>
        typeof user?.email === "string" &&
        user.email.toLowerCase() === values.email,
    )
  ) {
    errors.email = SIGNUP_ERRORS.duplicateEmail;
  }

  if (!isValidPassword(values.password)) {
    errors.password = SIGNUP_ERRORS.password;
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = SIGNUP_ERRORS.confirmPassword;
  }

  return errors;
}

function initializeSignupForm() {
  const form = document.querySelector("#signup-form");

  if (!form) {
    return;
  }

  const fields = {
    fullName: form.elements.fullName,
    email: form.elements.email,
    password: form.elements.password,
    confirmPassword: form.elements.confirmPassword,
  };
  const errorElements = {
    fullName: document.querySelector("#full-name-error"),
    email: document.querySelector("#signup-email-error"),
    password: document.querySelector("#signup-password-error"),
    confirmPassword: document.querySelector("#confirm-password-error"),
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const values = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim().toLowerCase(),
      password: fields.password.value,
      confirmPassword: fields.confirmPassword.value,
    };
    const errors = validateSignup(values, getStoredUsers());

    Object.keys(fields).forEach((fieldName) => {
      setFieldError(
        fields[fieldName],
        errorElements[fieldName],
        errors[fieldName],
      );
    });

    if (Object.keys(errors).length) {
      fields[Object.keys(errors)[0]].focus();
    }
  });
}

if (!redirectAuthenticatedUser()) {
  initializeTheme();
  initializeSignupForm();
}

