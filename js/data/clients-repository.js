import { STORAGE_KEYS } from "../core/constants.js";
import { readJSON, removeStorageItem, writeJSON } from "../core/storage.js";

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

export async function addClient(clientData) {
  const response = await fetch(`${CLIENTS_ENDPOINT}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      company: { name: clientData.company },
      image: clientData.image,
      status: clientData.status,
      dealValue: clientData.dealValue,
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not add client (${response.status}).`);
  }

  const addedUser = await response.json();

  if (addedUser.id === undefined || addedUser.id === null) {
    throw new Error("The added client response did not contain an id.");
  }

  return {
    id: addedUser.id,
    name: clientData.name,
    email: clientData.email.toLowerCase(),
    phone: clientData.phone,
    company: clientData.company,
    image: clientData.image,
    status: clientData.status,
    dealValue: clientData.dealValue,
    notes: [],
    createdAt: new Date().toISOString(),
  };
}

export async function deleteClient(clientId) {
  const response = await fetch(
    `${CLIENTS_ENDPOINT}/${encodeURIComponent(clientId)}`,
    { method: "DELETE" },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Could not delete client (${response.status}).`);
  }
}

export async function resetClients() {
  removeStorageItem(STORAGE_KEYS.clients);
  return loadClients();
}

