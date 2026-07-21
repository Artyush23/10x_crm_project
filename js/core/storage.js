export function readJSON(key, fallback = null) {
  const storedValue = localStorage.getItem(key);

  if (storedValue === null) {
    return fallback;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.warn(`Could not parse localStorage key "${key}".`, error);
    return fallback;
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function readString(key, fallback = "") {
  return localStorage.getItem(key) ?? fallback;
}

export function writeString(key, value) {
  const stringValue = String(value);
  localStorage.setItem(key, stringValue);
  return stringValue;
}

export function removeStorageItem(key) {
  localStorage.removeItem(key);
}

