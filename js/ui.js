// Общие элементы интерфейса: подсказки "?", подтверждение, уведомления с "Отменить".

export function createHintButton(text) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "hint-btn";
  btn.textContent = "?";
  btn.setAttribute("aria-label", "Подсказка");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    showHint(btn, text);
  });
  return btn;
}

let openHintPopup = null;
function closeHint() {
  if (openHintPopup) {
    openHintPopup.remove();
    openHintPopup = null;
    document.removeEventListener("click", closeHint);
  }
}

function showHint(anchorEl, text) {
  closeHint();
  const popup = document.createElement("div");
  popup.className = "tooltip-popup";
  popup.textContent = text;
  document.body.appendChild(popup);

  const rect = anchorEl.getBoundingClientRect();
  const popupWidth = Math.min(320, window.innerWidth - 24);
  popup.style.width = popupWidth + "px";
  let left = rect.left - popupWidth + rect.width;
  left = Math.max(12, Math.min(left, window.innerWidth - popupWidth - 12));
  let top = rect.bottom + 8;
  if (top + 90 > window.innerHeight) {
    top = rect.top - 8 - popup.offsetHeight;
  }
  popup.style.left = left + "px";
  popup.style.top = top + "px";

  openHintPopup = popup;
  setTimeout(() => document.addEventListener("click", closeHint), 0);
}

export function confirmDialog({ title = "Вы уверены?", message = "", confirmLabel = "Да, продолжить", cancelLabel = "Отмена", danger = true } = {}) {
  return new Promise((resolve) => {
    const root = document.getElementById("modal-root");
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal-sheet">
        <h2>${escapeHtml(title)}</h2>
        ${message ? `<p class="muted">${escapeHtml(message)}</p>` : ""}
        <div class="modal-actions">
          <button class="btn ${danger ? "btn-danger" : "btn-primary"} btn-block btn-lg" data-action="confirm">${escapeHtml(confirmLabel)}</button>
          <button class="btn btn-ghost btn-block btn-lg" data-action="cancel">${escapeHtml(cancelLabel)}</button>
        </div>
      </div>
    `;
    function cleanup(result) {
      backdrop.remove();
      resolve(result);
    }
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) cleanup(false);
    });
    backdrop.querySelector('[data-action="confirm"]').addEventListener("click", () => cleanup(true));
    backdrop.querySelector('[data-action="cancel"]').addEventListener("click", () => cleanup(false));
    root.appendChild(backdrop);
  });
}

export function showToast(message, { actionLabel, onAction, duration = 4000 } = {}) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  const span = document.createElement("span");
  span.textContent = message;
  toast.appendChild(span);

  let timer;
  function remove() {
    clearTimeout(timer);
    toast.remove();
  }

  if (actionLabel && onAction) {
    const btn = document.createElement("button");
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => {
      onAction();
      remove();
    });
    toast.appendChild(btn);
  }

  container.appendChild(toast);
  timer = setTimeout(remove, duration);
  return remove;
}

export function showError(message) {
  showToast("⚠ " + message, { duration: 6000 });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
