import { STORAGE_KEYS } from "../core/constants.js";
import { readJSON, writeJSON } from "../core/storage.js";

const CLIENTS_ENDPOINT = "https://dummyjson.com/users";

function createDealValue(userId) {
  return ((Number(userId) % 20) + 1) * 500;
}

export function mapApiUserToClient(user) {
  return {
    id: user.id,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    email: user.email ?? "",
    phone: user.phone ?? "",
    company: user.company?.name ?? "",
    image: user.image ?? "",
    status: "Lead",
    dealValue: createDealValue(user.id),
    notes: [],
    createdAt: new Date().toISOString(),
  };
}

export function saveClients(clients) {
  return writeJSON(STORAGE_KEYS.clients, clients);
}

export async function loadClients() {
  if (localStorage.getItem(STORAGE_KEYS.clients) !== null) {
    const storedClients = readJSON(STORAGE_KEYS.clients, []);
    return Array.isArray(storedClients) ? storedClients : [];
  }

  const response = await fetch(`${CLIENTS_ENDPOINT}?limit=30`);

  if (!response.ok) {
    throw new Error(`Could not load clients (${response.status}).`);
  }

  const data = await response.json();

  if (!Array.isArray(data.users)) {
    throw new Error("The client response did not contain a users array.");
  }

  const clients = data.users.map(mapApiUserToClient);
  saveClients(clients);
  return clients;
}

