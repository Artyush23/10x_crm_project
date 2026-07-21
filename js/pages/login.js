import { createSession, findUserByEmail } from "../core/auth.js";
import { redirectAuthenticatedUser } from "../core/guard.js";
import { initializeTheme } from "../core/theme.js";

const LOGIN_ERRORS = Object.freeze({
  email: "Email is required",
  password: "Password is required",
  credentials: "Invalid email or password",
});

function setFieldError(input, errorElement, message = "") {
  input.classList.toggle("input-error", Boolean(message));
  errorElement.textContent = message;

  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

function initializeLoginForm() {
  const form = document.querySelector("#login-form");

  if (!form) {
    return;
  }

  const emailInput = form.elements.email;
  const passwordInput = form.elements.password;
  const emailError = document.querySelector("#login-email-error");
  const passwordError = document.querySelector("#login-password-error");
  const credentialsError = document.querySelector("#login-credentials-error");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const emailMessage = email ? "" : LOGIN_ERRORS.email;
    const passwordMessage = password ? "" : LOGIN_ERRORS.password;

    setFieldError(emailInput, emailError, emailMessage);
    setFieldError(passwordInput, passwordError, passwordMessage);
    credentialsError.textContent = "";

    if (emailMessage || passwordMessage) {
      (emailMessage ? emailInput : passwordInput).focus();
      return;
    }

    const user = findUserByEmail(email);

    if (!user || user.password !== password) {
      credentialsError.textContent = LOGIN_ERRORS.credentials;
      emailInput.classList.add("input-error");
      passwordInput.classList.add("input-error");
      emailInput.setAttribute("aria-invalid", "true");
      passwordInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      return;
    }

    createSession(user);
    window.location.href = "dashboard.html";
  });
}

if (!redirectAuthenticatedUser()) {
  initializeTheme();
  initializeLoginForm();
}

