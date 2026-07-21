import { logout } from "./auth.js";
import { bindThemeToggle } from "./theme.js";

const NAVIGATION_ITEMS = Object.freeze([
  { page: "dashboard", label: "Dashboard", href: "dashboard.html" },
  { page: "clients", label: "Clients", href: "clients.html" },
  { page: "profile", label: "Profile", href: "profile.html" },
]);

function createNavigationLink({ page, label, href }, activePage) {
  const link = document.createElement("a");
  const isActive = page === activePage;

  link.className = "app-nav__link";
  link.href = href;
  link.dataset.pageLink = page;
  link.textContent = label;

  if (isActive) {
    link.classList.add("is-active");
    link.setAttribute("aria-current", "page");
  }

  return link;
}

export function initializeNavigation(activePage = document.body.dataset.page) {
  const root = document.querySelector("[data-navigation-root]");

  if (!root) {
    return;
  }

  root.replaceChildren();

  const navigation = document.createElement("nav");
  const brand = document.createElement("a");
  const logo = document.createElement("img");
  const brandLabel = document.createElement("span");
  const links = document.createElement("div");
  const actions = document.createElement("div");
  const themeButton = document.createElement("button");
  const themeLabel = document.createElement("span");
  const logoutButton = document.createElement("button");

  navigation.className = "app-nav";
  navigation.setAttribute("aria-label", "Primary navigation");

  brand.className = "app-nav__brand";
  brand.href = "dashboard.html";
  brand.setAttribute("aria-label", "10X CRM dashboard");

  logo.src = "assets/logo.svg";
  logo.alt = "";
  logo.width = 32;
  logo.height = 32;

  brandLabel.textContent = "10X CRM";
  brand.append(logo, brandLabel);

  links.className = "app-nav__links";
  NAVIGATION_ITEMS.forEach((item) => {
    links.append(createNavigationLink(item, activePage));
  });

  actions.className = "app-nav__actions";

  themeButton.className = "app-nav__action";
  themeButton.type = "button";
  themeButton.dataset.themeToggle = "";
  themeLabel.dataset.themeLabel = "";
  themeButton.append(themeLabel);
  bindThemeToggle(themeButton);

  logoutButton.className = "app-nav__action app-nav__action--danger";
  logoutButton.type = "button";
  logoutButton.textContent = "Logout";
  logoutButton.addEventListener("click", logout);

  actions.append(themeButton, logoutButton);
  navigation.append(brand, links, actions);
  root.append(navigation);
}

