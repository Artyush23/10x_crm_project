import { logout } from "./auth.js";
import { createIcon } from "./icons.js";
import { bindThemeToggle } from "./theme.js";

const NAVIGATION_ITEMS = Object.freeze([
  {
    page: "dashboard",
    label: "Dashboard",
    href: "dashboard.html",
    icon: "dashboard",
  },
  { page: "clients", label: "Clients", href: "clients.html", icon: "clients" },
  { page: "profile", label: "Profile", href: "profile.html", icon: "profile" },
]);

function createNavigationLink({ page, label, href, icon }, activePage) {
  const link = document.createElement("a");
  const labelElement = document.createElement("span");
  const isActive = page === activePage;

  link.className = "app-nav__link";
  link.href = href;
  link.dataset.pageLink = page;
  labelElement.className = "app-nav__label";
  labelElement.textContent = label;
  link.append(createIcon(icon, "ui-icon app-nav__icon"), labelElement);

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
  const themeIcon = document.createElement("span");
  const themeLabel = document.createElement("span");
  const logoutButton = document.createElement("button");
  const logoutLabel = document.createElement("span");

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
  themeIcon.className = "app-nav__icon";
  themeIcon.dataset.themeIcon = "";
  themeLabel.dataset.themeLabel = "";
  themeLabel.className = "app-nav__label";
  themeButton.append(themeIcon, themeLabel);
  bindThemeToggle(themeButton);

  logoutButton.className = "app-nav__action app-nav__action--danger";
  logoutButton.type = "button";
  logoutLabel.className = "app-nav__label";
  logoutLabel.textContent = "Logout";
  logoutButton.append(createIcon("logout", "ui-icon app-nav__icon"), logoutLabel);
  logoutButton.addEventListener("click", logout);

  actions.append(themeButton, logoutButton);
  navigation.append(brand, links, actions);
  root.append(navigation);
}

