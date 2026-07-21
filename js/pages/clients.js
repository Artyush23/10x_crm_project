import { requireSession } from "../core/guard.js";
import { bindModal } from "../core/modal.js";
import { showToast } from "../core/notifications.js";
import { initializeTheme } from "../core/theme.js";
import { initializeNavigation } from "../core/navigation.js";
import {
  addClient,
  deleteClient,
  loadClients,
  saveClients,
} from "../data/clients-repository.js";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const ALLOWED_STATUSES = Object.freeze(["Lead", "Contacted", "Won", "Lost"]);

let clients = [];
let activeStatusFilter = "All";
let searchTerm = "";
let sortMode = "newest";

const CLIENT_FORM_ERRORS = Object.freeze({
  name: "Name must be at least 3 characters",
  email: "Please enter a valid email address",
  duplicateEmail: "A client with this email already exists",
  phone: "Phone number looks too short",
  dealValue: "Deal value must be a positive number",
});

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getStatusClass(status) {
  const statusClasses = {
    Lead: "status-badge--lead",
    Contacted: "status-badge--contacted",
    Won: "status-badge--won",
    Lost: "status-badge--lost",
  };

  return statusClasses[status] ?? statusClasses.Lead;
}

function createStatusSelect(client) {
  const select = document.createElement("select");

  select.className = `client-card__status ${getStatusClass(client.status)}`;
  select.dataset.action = "change-status";
  select.dataset.id = String(client.id);
  select.setAttribute("aria-label", `Status for ${client.name}`);

  ALLOWED_STATUSES.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = status === client.status;
    select.append(option);
  });

  return select;
}

export function getVisibleClients() {
  let visibleClients = [...clients];

  if (activeStatusFilter !== "All") {
    visibleClients = visibleClients.filter(
      (client) => client.status === activeStatusFilter,
    );
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (normalizedSearchTerm) {
    visibleClients = visibleClients.filter((client) => {
      const name = String(client.name ?? "").toLowerCase();
      const company = String(client.company ?? "").toLowerCase();
      return (
        name.includes(normalizedSearchTerm) ||
        company.includes(normalizedSearchTerm)
      );
    });
  }

  if (sortMode === "name") {
    visibleClients.sort((first, second) =>
      String(first.name).localeCompare(String(second.name)),
    );
  } else if (sortMode === "deal-value") {
    visibleClients.sort(
      (first, second) => Number(second.dealValue) - Number(first.dealValue),
    );
  } else {
    visibleClients.sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );
  }

  return visibleClients;
}

function renderVisibleClients() {
  renderClients(getVisibleClients());
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

function setFieldError(input, errorElement, message = "") {
  input.classList.toggle("input-error", Boolean(message));
  errorElement.textContent = message;

  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

function validateClient(values) {
  const errors = {};

  if (values.name.length < 3) {
    errors.name = CLIENT_FORM_ERRORS.name;
  }

  if (!isValidEmail(values.email)) {
    errors.email = CLIENT_FORM_ERRORS.email;
  } else if (
    clients.some(
      (client) =>
        typeof client.email === "string" &&
        client.email.toLowerCase() === values.email,
    )
  ) {
    errors.email = CLIENT_FORM_ERRORS.duplicateEmail;
  }

  if (values.phone && values.phone.length < 6) {
    errors.phone = CLIENT_FORM_ERRORS.phone;
  }

  if (
    !values.dealValueRaw ||
    Number.isNaN(values.dealValue) ||
    values.dealValue <= 0
  ) {
    errors.dealValue = CLIENT_FORM_ERRORS.dealValue;
  }

  return errors;
}

function clearClientForm(form, fields, errorElements) {
  form.reset();
  Object.keys(fields).forEach((fieldName) => {
    setFieldError(fields[fieldName], errorElements[fieldName]);
  });
  document.querySelector("#add-client-submit-error").textContent = "";
}

function initializeAddClientModal() {
  const modal = document.querySelector("#add-client-modal");
  const openButton = document.querySelector("#add-client-button");
  const form = document.querySelector("#add-client-form");
  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    phone: form.elements.phone,
    dealValue: form.elements.dealValue,
  };
  const errorElements = {
    name: document.querySelector("#client-name-error"),
    email: document.querySelector("#client-email-error"),
    phone: document.querySelector("#client-phone-error"),
    dealValue: document.querySelector("#client-deal-value-error"),
  };
  const submitButton = form.querySelector('button[type="submit"]');
  const submitError = document.querySelector("#add-client-submit-error");
  const modalController = bindModal({
    modal,
    openButton,
    onClose: () => clearClientForm(form, fields, errorElements),
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dealValueRaw = fields.dealValue.value.trim();
    const values = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim().toLowerCase(),
      phone: fields.phone.value.trim(),
      company: form.elements.company.value.trim(),
      dealValueRaw,
      dealValue: Number(dealValueRaw),
      status: form.elements.status.value,
    };
    const errors = validateClient(values);

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

    submitError.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Adding...";

    try {
      const newClient = await addClient(values);
      clients.unshift(newClient);
      saveClients(clients);
      renderVisibleClients();
      modalController.close();
      showToast("Client added ✓");
    } catch (error) {
      console.error("Could not add client.", error);
      submitError.textContent = "Could not add client. Please try again.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Add Client";
    }
  });

  return modalController;
}

function createClientCard(client) {
  const card = document.createElement("article");
  const identity = document.createElement("div");
  const avatar = document.createElement("div");
  const initials = document.createElement("span");
  const identityText = document.createElement("div");
  const name = document.createElement("h3");
  const company = document.createElement("p");
  const email = document.createElement("p");
  const statusSelect = createStatusSelect(client);
  const dealValue = document.createElement("p");
  const deleteButton = document.createElement("button");

  card.className = "client-card";
  card.dataset.id = String(client.id);

  identity.className = "client-card__identity";
  avatar.className = "client-card__avatar";
  initials.textContent = getInitials(client.name) || "?";
  avatar.append(initials);

  if (client.image) {
    const image = document.createElement("img");
    image.src = client.image;
    image.alt = "";
    image.addEventListener("error", () => image.remove(), { once: true });
    avatar.append(image);
  }

  name.className = "client-card__name";
  name.textContent = client.name;
  company.className = "client-card__company";
  company.textContent = client.company || "No company";
  identityText.append(name, company);
  identity.append(avatar, identityText);

  email.className = "client-card__email";
  email.textContent = client.email;

  dealValue.className = "client-card__deal";
  dealValue.textContent = CURRENCY_FORMATTER.format(client.dealValue);

  deleteButton.className = "client-card__delete";
  deleteButton.type = "button";
  deleteButton.dataset.id = String(client.id);
  deleteButton.dataset.action = "delete-client";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${client.name}`);

  card.append(identity, email, statusSelect, dealValue, deleteButton);
  return card;
}

export function renderClients(list) {
  const listElement = document.querySelector("#client-list");

  if (!listElement) {
    return;
  }

  listElement.replaceChildren();

  if (!list.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "client-list__message";
    emptyMessage.textContent = "No clients found.";
    listElement.append(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();
  list.forEach((client) => fragment.append(createClientCard(client)));
  listElement.append(fragment);
}

function renderLoadError() {
  const listElement = document.querySelector("#client-list");
  const errorState = document.createElement("div");
  const message = document.createElement("p");
  const retryButton = document.createElement("button");

  errorState.className = "client-list__error";
  message.textContent =
    "Could not load clients. Check your connection and try again.";
  retryButton.className = "client-list__retry";
  retryButton.type = "button";
  retryButton.textContent = "Retry";
  retryButton.addEventListener("click", initializeClientList);
  errorState.append(message, retryButton);
  listElement.replaceChildren(errorState);
}

function initializeClientActions() {
  const listElement = document.querySelector("#client-list");

  listElement.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(
      '[data-action="delete-client"]',
    );

    if (!deleteButton || !listElement.contains(deleteButton)) {
      return;
    }

    const clientId = deleteButton.dataset.id;
    const confirmed = window.confirm(
      "Delete this client? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";

    try {
      await deleteClient(clientId);
      clients = clients.filter((client) => String(client.id) !== clientId);
      saveClients(clients);
      renderVisibleClients();
      showToast("Client deleted");
    } catch (error) {
      console.error("Could not delete client.", error);
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete";
      showToast("Could not delete client. Please try again.", {
        type: "error",
      });
    }
  });

  listElement.addEventListener("change", (event) => {
    const statusSelect = event.target.closest('[data-action="change-status"]');

    if (!statusSelect || !listElement.contains(statusSelect)) {
      return;
    }

    const client = clients.find(
      (item) => String(item.id) === statusSelect.dataset.id,
    );
    const newStatus = statusSelect.value;

    if (!client || !ALLOWED_STATUSES.includes(newStatus)) {
      return;
    }

    client.status = newStatus;
    saveClients(clients);
    renderVisibleClients();
  });
}

function initializeClientToolbar() {
  const searchInput = document.querySelector("#client-search");
  const filterButtons = document.querySelectorAll("[data-status-filter]");
  const sortSelect = document.querySelector("#client-sort");

  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value;
    renderVisibleClients();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const requestedStatus = button.dataset.statusFilter;

      if (
        requestedStatus !== "All" &&
        !ALLOWED_STATUSES.includes(requestedStatus)
      ) {
        return;
      }

      activeStatusFilter = requestedStatus;
      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle("is-active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
      });
      renderVisibleClients();
    });
  });

  sortSelect.addEventListener("change", () => {
    sortMode = sortSelect.value;
    renderVisibleClients();
  });
}

async function initializeClientList() {
  const listElement = document.querySelector("#client-list");
  const loadingMessage = document.createElement("p");
  loadingMessage.className = "client-list__message";
  loadingMessage.textContent = "Loading clients...";
  listElement.replaceChildren(loadingMessage);

  try {
    clients = await loadClients();
    renderVisibleClients();
  } catch (error) {
    console.error("Could not initialize clients.", error);
    renderLoadError();
  }
}

if (requireSession()) {
  initializeTheme();
  initializeNavigation();
  initializeAddClientModal();
  initializeClientActions();
  initializeClientToolbar();
  initializeClientList();
}

