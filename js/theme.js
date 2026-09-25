// Применение темы и размера шрифта к странице.

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }
}

export function applyFontSize(size) {
  if (size === "large") {
    document.documentElement.setAttribute("data-fontsize", "large");
  } else {
    document.documentElement.removeAttribute("data-fontsize");
  }
}
