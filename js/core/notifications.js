const DEFAULT_DURATION = 3000;
const SUPPORTED_TYPES = new Set(["success", "error"]);
const toastTimers = new WeakMap();

function getToastRegion() {
  const existingRegion = document.querySelector("[data-toast-region]");

  if (existingRegion) {
    return existingRegion;
  }

  const region = document.createElement("div");
  region.className = "toast-region";
  region.dataset.toastRegion = "";
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "false");
  document.body.append(region);

  return region;
}

function normalizeType(type) {
  return SUPPORTED_TYPES.has(type) ? type : "success";
}

export function dismissToast(toast) {
  if (!toast?.isConnected || toast.classList.contains("is-leaving")) {
    return;
  }

  const timerId = toastTimers.get(toast);
  if (timerId) {
    window.clearTimeout(timerId);
    toastTimers.delete(toast);
  }

  toast.classList.add("is-leaving");

  window.setTimeout(() => {
    const region = toast.parentElement;
    toast.remove();

    if (region && !region.children.length) {
      region.remove();
    }
  }, 180);
}

export function showToast(
  message,
  { type = "success", duration = DEFAULT_DURATION } = {},
) {
  const normalizedType = normalizeType(type);
  const region = getToastRegion();
  const toast = document.createElement("div");
  const messageElement = document.createElement("span");
  const closeButton = document.createElement("button");

  toast.className = `toast toast--${normalizedType}`;
  toast.setAttribute("role", normalizedType === "error" ? "alert" : "status");

  messageElement.className = "toast__message";
  messageElement.textContent = String(message);

  closeButton.className = "toast__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Dismiss notification");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => dismissToast(toast));

  toast.append(messageElement, closeButton);
  region.append(toast);

  if (Number.isFinite(duration) && duration > 0) {
    const timerId = window.setTimeout(() => dismissToast(toast), duration);
    toastTimers.set(toast, timerId);
  }

  return toast;
}

