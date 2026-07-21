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
const CLIENT_SINCE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});
const ALLOWED_STATUSES = Object.freeze(["Lead", "Contacted", "Won", "Lost"]);

let clients = [];
let activeStatusFilter = "All";
let searchTerm = "";
let sortMode = "newest";
let detailsModalController = null;

const CLIENT_FORM_ERRORS = Object.freeze({
  name: "Name must be at least 3 characters",
  email: "Please enter a valid email address",
  duplicateEmail: "A client with this email already exists",
  phone: "Phone number looks too short",
  image: "Image URL must start with http:// or https://",
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

function getAvatarGradient(client) {
  const seed = [client.id, client.name, client.email]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .join("|");
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const normalizedHash = hash >>> 0;
  const firstHue = normalizedHash % 360;
  const secondHue = (firstHue + 38 + ((normalizedHash >>> 8) % 67)) % 360;
  const angle = 115 + ((normalizedHash >>> 16) % 131);

  return { firstHue, secondHue, angle };
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

function createClientAvatar(client, className = "client-card__avatar") {
  const avatar = document.createElement("div");
  const initials = document.createElement("span");
  const gradient = getAvatarGradient(client);

  avatar.className = className;
  avatar.style.setProperty("--avatar-hue", String(gradient.firstHue));
  avatar.style.setProperty("--avatar-hue-alt", String(gradient.secondHue));
  avatar.style.setProperty("--avatar-angle", `${gradient.angle}deg`);
  initials.textContent = getInitials(client.name) || "?";
  avatar.append(initials);

  if (client.image) {
    const image = document.createElement("img");
    image.src = client.image;
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    image.addEventListener("error", () => image.remove(), { once: true });
    avatar.append(image);
  }

  return avatar;
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

  if (values.image && !/^https?:\/\//i.test(values.image)) {
    errors.image = CLIENT_FORM_ERRORS.image;
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

function ensureUniqueClientId(client) {
  if (!clients.some((item) => String(item.id) === String(client.id))) {
    return client;
  }

  let suffix = 0;
  const timestamp = Date.now();
  let localId = timestamp;

  while (clients.some((item) => String(item.id) === String(localId))) {
    suffix += 1;
    localId = timestamp + suffix;
  }

  return { ...client, id: localId };
}

function initializeAddClientModal() {
  const modal = document.querySelector("#add-client-modal");
  const openButton = document.querySelector("#add-client-button");
  const form = document.querySelector("#add-client-form");
  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    phone: form.elements.phone,
    image: form.elements.image,
    dealValue: form.elements.dealValue,
  };
  const errorElements = {
    name: document.querySelector("#client-name-error"),
    email: document.querySelector("#client-email-error"),
    phone: document.querySelector("#client-phone-error"),
    image: document.querySelector("#client-image-error"),
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
      image: fields.image.value.trim(),
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
      const newClient = ensureUniqueClientId(await addClient(values));
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
  const avatar = createClientAvatar(client);
  const identityText = document.createElement("div");
  const name = document.createElement("h3");
  const company = document.createElement("p");
  const email = document.createElement("p");
  const statusSelect = createStatusSelect(client);
  const dealValue = document.createElement("p");
  const deleteButton = document.createElement("button");

  card.className = "client-card";
  card.dataset.id = String(client.id);
  card.setAttribute("aria-label", `View details for ${client.name}`);

  identity.className = "client-card__identity";

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

function formatClientSince(createdAt) {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : CLIENT_SINCE_FORMATTER.format(date);
}

function appendDetail(detailsList, label, value) {
  const item = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");

  term.textContent = label;
  description.textContent = value || "Not provided";
  item.append(term, description);
  detailsList.append(item);
}

function createNotesSection(client) {
  const section = document.createElement("section");
  const heading = document.createElement("h4");
  const notesContainer = document.createElement("div");
  const form = document.createElement("form");
  const label = document.createElement("label");
  const input = document.createElement("textarea");
  const error = document.createElement("p");
  const submitButton = document.createElement("button");
  const notes = Array.isArray(client.notes) ? client.notes : [];

  section.className = "client-notes";
  heading.textContent = "Notes";
  notesContainer.className = "client-notes__list";

  if (notes.length) {
    const list = document.createElement("ol");

    notes.forEach((note) => {
      const item = document.createElement("li");
      const text = document.createElement("p");
      const date = document.createElement("time");
      text.textContent = note.text;
      date.textContent = note.date;
      item.append(text, date);
      list.append(item);
    });

    notesContainer.append(list);
  } else {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "client-notes__empty";
    emptyMessage.textContent = "No notes yet.";
    notesContainer.append(emptyMessage);
  }

  form.className = "client-notes__form";
  label.className = "visually-hidden";
  label.htmlFor = "client-note-text";
  label.textContent = `Add a note for ${client.name}`;

  input.id = "client-note-text";
  input.name = "note";
  input.rows = 3;
  input.placeholder = "Add a note";
  input.setAttribute("aria-describedby", "client-note-error");

  error.className = "form-error";
  error.id = "client-note-error";
  error.setAttribute("aria-live", "polite");

  submitButton.type = "submit";
  submitButton.textContent = "Add note";

  form.append(label, input, error, submitButton);
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const noteText = input.value.trim();

    if (!noteText) {
      input.classList.add("input-error");
      input.setAttribute("aria-invalid", "true");
      error.textContent = "Note cannot be empty.";
      input.focus();
      return;
    }

    if (!Array.isArray(client.notes)) {
      client.notes = [];
    }

    client.notes.push({
      text: noteText,
      date: new Date().toLocaleString(),
    });
    saveClients(clients);
    renderClientDetails(client);
  });

  section.append(heading, notesContainer, form);
  return section;
}

function createReminderAction(client) {
  const actions = document.createElement("div");
  const reminderButton = document.createElement("button");

  actions.className = "client-details__actions";
  reminderButton.className = "button--secondary";
  reminderButton.type = "button";
  reminderButton.textContent = "Remind me in 1 min";
  reminderButton.addEventListener("click", () => {
    const clientName = client.name;
    showToast("Reminder set ✓");

    window.setTimeout(() => {
      showToast(`Follow up: ${clientName}`);
    }, 60000);
  });

  actions.append(reminderButton);
  return actions;
}

function renderClientDetails(client) {
  const content = document.querySelector("#client-details-content");
  const identity = document.createElement("div");
  const avatar = createClientAvatar(
    client,
    "client-card__avatar client-details__avatar",
  );
  const identityText = document.createElement("div");
  const name = document.createElement("h3");
  const company = document.createElement("p");
  const detailsList = document.createElement("dl");
  const statusItem = document.createElement("div");
  const statusTerm = document.createElement("dt");
  const statusDescription = document.createElement("dd");
  const status = document.createElement("span");

  identity.className = "client-details__identity";
  name.textContent = client.name;
  company.textContent = client.company || "No company";
  identityText.append(name, company);
  identity.append(avatar, identityText);

  detailsList.className = "client-details__list";
  appendDetail(detailsList, "Email", client.email);
  appendDetail(detailsList, "Phone", client.phone);

  statusTerm.textContent = "Status";
  status.className = `status-badge ${getStatusClass(client.status)}`;
  status.textContent = client.status;
  statusDescription.append(status);
  statusItem.append(statusTerm, statusDescription);
  detailsList.append(statusItem);

  appendDetail(
    detailsList,
    "Deal value",
    CURRENCY_FORMATTER.format(client.dealValue),
  );
  appendDetail(
    detailsList,
    "Client since",
    formatClientSince(client.createdAt),
  );

  content.replaceChildren(
    identity,
    detailsList,
    createReminderAction(client),
    createNotesSection(client),
  );
}

function openClientDetails(clientId) {
  const client = clients.find((item) => String(item.id) === clientId);

  if (!client || !detailsModalController) {
    return;
  }

  renderClientDetails(client);
  detailsModalController.open();
}

function initializeClientDetailsModal() {
  const modal = document.querySelector("#client-details-modal");
  detailsModalController = bindModal({
    modal,
    onClose: () => {
      document.querySelector("#client-details-content").replaceChildren();
    },
  });
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
      const interactiveElement = event.target.closest(
        "button, select, input, textarea, a",
      );
      const card = event.target.closest(".client-card");

      if (!interactiveElement && card && listElement.contains(card)) {
        openClientDetails(card.dataset.id);
      }
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
  initializeClientDetailsModal();
  initializeClientActions();
  initializeClientToolbar();
  initializeClientList();
}

