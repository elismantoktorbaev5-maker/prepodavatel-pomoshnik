// Заглушка для разделов, которые будут добавлены на следующих этапах.

export function makePlaceholder(titleText, icon, description) {
  return {
    title: titleText,
    async render(container) {
      container.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "empty-state";
      wrap.innerHTML = `
        <div class="empty-icon">${icon}</div>
        <h2>${titleText}</h2>
        <p>${description}</p>
        <p class="muted">Этот раздел появится на одном из следующих этапов.</p>
      `;
      container.appendChild(wrap);
    },
  };
}
