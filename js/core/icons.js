const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const ICON_PATHS = Object.freeze({
  dashboard: [
    "M4 4.5h6v6H4z",
    "M14 4.5h6v4H14z",
    "M14 12.5h6v7H14z",
    "M4 14.5h6v5H4z",
  ],
  clients: [
    "M16.5 20v-1.5a4 4 0 0 0-4-4h-5a4 4 0 0 0-4 4V20",
    "M10 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z",
    "M17 11a3 3 0 0 0 0-6",
    "M20.5 20v-1.5a3.75 3.75 0 0 0-2.8-3.63",
  ],
  profile: [
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M4.5 20a7.5 7.5 0 0 1 15 0",
  ],
  sun: [
    "M12 3V1.75",
    "M12 22.25V21",
    "m5.66 3.34.88-.88",
    "m5.46 17.54.88-.88",
    "M21 12h1.25",
    "M1.75 12H3",
    "m17.66 18.66.88.88",
    "m3.46 3.46.88.88",
    "M12 16.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z",
  ],
  moon: [
    "M20.2 15.15A8.35 8.35 0 0 1 8.85 3.8 8.4 8.4 0 1 0 20.2 15.15Z",
  ],
  logout: [
    "M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10",
    "M14.5 8.5 18 12l-3.5 3.5",
    "M18 12H9",
  ],
});

export function createIcon(name, className = "ui-icon") {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");

  svg.classList.add(...className.split(" ").filter(Boolean));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  (ICON_PATHS[name] ?? []).forEach((pathData) => {
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", pathData);
    svg.append(path);
  });

  return svg;
}
