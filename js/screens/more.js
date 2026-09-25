export const title = "Ещё";

const ITEMS = [
  { icon: "📄", label: "AVN", href: "#/avn" },
  { icon: "📚", label: "Документы", href: "#/documents" },
  { icon: "🧩", label: "Шаблоны", href: "#/templates" },
  { icon: "✏️", label: "Задания по английскому", href: "#/exercises" },
  { icon: "⏱️", label: "На уроке", href: "#/classroom" },
  { icon: "💾", label: "Резервная копия", href: "#/backup" },
  { icon: "⚙️", label: "Настройки", href: "#/settings" },
];

export async function render(container) {
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "tile-grid";
  for (const item of ITEMS) {
    const a = document.createElement("a");
    a.className = "tile";
    a.href = item.href;
    a.innerHTML = `<span class="tile-icon">${item.icon}</span><span class="tile-title">${item.label}</span>`;
    grid.appendChild(a);
  }
  container.appendChild(grid);
}
