let activeModal = null;
let previouslyFocusedElement = null;

export function openModal(modal, initialFocusElement = null) {
  if (!modal) {
    return;
  }

  previouslyFocusedElement = document.activeElement;
  activeModal = modal;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  (initialFocusElement ?? modal.querySelector("button, input, select"))?.focus();
}

export function closeModal(modal = activeModal) {
  if (!modal) {
    return;
  }

  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  activeModal = null;
  previouslyFocusedElement?.focus();
  previouslyFocusedElement = null;
}

export function bindModal({ modal, openButton, onClose }) {
  if (!modal || !openButton) {
    return null;
  }

  const close = () => {
    closeModal(modal);
    onClose?.();
  };

  openButton.addEventListener("click", () => {
    openModal(modal, modal.querySelector("input"));
  });

  modal.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", close);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });

  return { close, open: () => openModal(modal, modal.querySelector("input")) };
}

