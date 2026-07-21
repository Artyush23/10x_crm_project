import { requireSession } from "../core/guard.js";
import { initializeTheme } from "../core/theme.js";
import { initializeNavigation } from "../core/navigation.js";
import { loadClients } from "../data/clients-repository.js";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

let clients = [];

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

function createClientCard(client) {
  const card = document.createElement("article");
  const identity = document.createElement("div");
  const avatar = document.createElement("div");
  const initials = document.createElement("span");
  const identityText = document.createElement("div");
  const name = document.createElement("h3");
  const company = document.createElement("p");
  const email = document.createElement("p");
  const status = document.createElement("span");
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

  status.className = `status-badge ${getStatusClass(client.status)}`;
  status.textContent = client.status;

  dealValue.className = "client-card__deal";
  dealValue.textContent = CURRENCY_FORMATTER.format(client.dealValue);

  deleteButton.className = "client-card__delete";
  deleteButton.type = "button";
  deleteButton.dataset.id = String(client.id);
  deleteButton.dataset.action = "delete-client";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${client.name}`);

  card.append(identity, email, status, dealValue, deleteButton);
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

async function initializeClientList() {
  const listElement = document.querySelector("#client-list");
  const loadingMessage = document.createElement("p");
  loadingMessage.className = "client-list__message";
  loadingMessage.textContent = "Loading clients...";
  listElement.replaceChildren(loadingMessage);

  try {
    clients = await loadClients();
    renderClients(clients);
  } catch (error) {
    console.error("Could not initialize clients.", error);
    renderLoadError();
  }
}

if (requireSession()) {
  initializeTheme();
  initializeNavigation();
  initializeClientList();
}

