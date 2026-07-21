import { getSession, getUsers } from "../core/auth.js";
import { requireSession } from "../core/guard.js";
import { initializeTheme } from "../core/theme.js";
import { initializeNavigation } from "../core/navigation.js";
import { loadClients } from "../data/clients-repository.js";

const MILLISECONDS_PER_DAY = 86400000;
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const PIPELINE_STATUSES = Object.freeze([
  "Lead",
  "Contacted",
  "Won",
  "Lost",
]);
const STATUS_CLASS_NAMES = Object.freeze({
  Lead: "status-badge--lead",
  Contacted: "status-badge--contacted",
  Won: "status-badge--won",
  Lost: "status-badge--lost",
});

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

export function calculateDashboardStats(clients, currentTime = Date.now()) {
  const activeDeals = clients.filter(
    (client) => client.status !== "Won" && client.status !== "Lost",
  ).length;
  const wonRevenue = clients
    .filter((client) => client.status === "Won")
    .reduce((total, client) => total + Number(client.dealValue || 0), 0);
  const newThisWeek = clients.filter((client) => {
    const createdTime = new Date(client.createdAt).getTime();
    const ageInDays = (currentTime - createdTime) / MILLISECONDS_PER_DAY;
    return Number.isFinite(ageInDays) && ageInDays <= 7;
  }).length;

  return {
    totalClients: clients.length,
    activeDeals,
    wonRevenue,
    newThisWeek,
  };
}

export function calculatePipelineCounts(clients) {
  return clients.reduce(
    (counts, client) => {
      if (PIPELINE_STATUSES.includes(client.status)) {
        counts[client.status] += 1;
      }
      return counts;
    },
    { Lead: 0, Contacted: 0, Won: 0, Lost: 0 },
  );
}

function renderDashboardMetrics(clients) {
  const stats = calculateDashboardStats(clients);
  const pipelineCounts = calculatePipelineCounts(clients);

  document.querySelector('[data-stat="total-clients"]').textContent =
    String(stats.totalClients);
  document.querySelector('[data-stat="active-deals"]').textContent =
    String(stats.activeDeals);
  document.querySelector('[data-stat="won-revenue"]').textContent =
    CURRENCY_FORMATTER.format(stats.wonRevenue);
  document.querySelector('[data-stat="new-this-week"]').textContent =
    String(stats.newThisWeek);

  PIPELINE_STATUSES.forEach((status) => {
    document.querySelector(`[data-pipeline="${status}"]`).textContent =
      String(pipelineCounts[status]);
  });
}

function getCreatedTime(client) {
  const createdTime = new Date(client.createdAt).getTime();
  return Number.isFinite(createdTime) ? createdTime : 0;
}

export function getRecentClients(clients) {
  return [...clients]
    .sort((first, second) => getCreatedTime(second) - getCreatedTime(first))
    .slice(0, 5);
}

function createRecentClientRow(client) {
  const row = document.createElement("article");
  const identity = document.createElement("div");
  const name = document.createElement("h3");
  const company = document.createElement("p");
  const status = document.createElement("span");
  const date = document.createElement("time");
  const createdDate = new Date(client.createdAt);

  row.className = "recent-client";
  identity.className = "recent-client__identity";
  name.className = "recent-client__name";
  name.textContent = client.name;
  company.className = "recent-client__company";
  company.textContent = client.company || "No company";
  identity.append(name, company);

  status.className = `status-badge ${
    STATUS_CLASS_NAMES[client.status] ?? STATUS_CLASS_NAMES.Lead
  }`;
  status.textContent = client.status;

  date.className = "recent-client__date";
  if (Number.isNaN(createdDate.getTime())) {
    date.textContent = "Unknown date";
  } else {
    date.dateTime = createdDate.toISOString();
    date.textContent = createdDate.toLocaleDateString();
  }

  row.append(identity, status, date);
  return row;
}

function renderRecentClients(clients) {
  const container = document.querySelector("#recent-clients");
  const recentClients = getRecentClients(clients);
  container.replaceChildren();

  if (!recentClients.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "recent-clients__empty";
    emptyMessage.textContent = "No clients yet.";
    container.append(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();
  recentClients.forEach((client) => {
    fragment.append(createRecentClientRow(client));
  });
  container.append(fragment);
}

function renderRecentClientsError() {
  const container = document.querySelector("#recent-clients");
  const message = document.createElement("p");
  message.className = "recent-clients__empty";
  message.textContent = "Recent clients are unavailable.";
  container.replaceChildren(message);
}

async function initializeDashboardData() {
  const statusElement = document.querySelector("#dashboard-status");

  try {
    const clients = await loadClients();
    renderDashboardMetrics(clients);
    renderRecentClients(clients);
    statusElement.textContent = "";
  } catch (error) {
    console.error("Could not initialize dashboard data.", error);
    statusElement.textContent =
      "Could not load dashboard data. Check your connection and try again.";
    renderRecentClientsError();
  }
}

if (requireSession()) {
  initializeTheme();
  initializeNavigation();
  initializeGreeting();
  initializeClock();
  initializeDashboardData();
}

