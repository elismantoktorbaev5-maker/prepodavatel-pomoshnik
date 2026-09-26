import { getAvnUrl, setAvnUrl } from "../avn.js";
import { createHintButton, showToast } from "../ui.js";

export const title = "Адрес AVN";

export async function render(container) {
  container.innerHTML = "";
  const url = await getAvnUrl();

  const card = document.createElement("div");
  card.className = "card";
  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "0.4rem";
  head.innerHTML = `<h3 style="flex:1;margin:0;">Адрес сайта AVN</h3>`;
  head.appendChild(createHintButton("Вставьте ссылку на сайт AVN, которым вы обычно пользуетесь на компьютере. Кнопка «Открыть AVN» будет открывать именно её."));
  card.appendChild(head);
  card.insertAdjacentHTML("beforeend", `
    <div class="field" style="margin-top:0.6rem;">
      <label>Ссылка (например, https://avn.example.kg)</label>
      <input type="text" id="avn-url" inputmode="url" placeholder="https://" value="${escapeAttr(url)}">
    </div>
    <button class="btn btn-primary btn-block" id="save-url">Сохранить</button>
  `);
  container.appendChild(card);

  card.querySelector("#save-url").addEventListener("click", async () => {
    const val = card.querySelector("#avn-url").value.trim();
    await setAvnUrl(val);
    showToast("Адрес сохранён");
  });
}

function escapeAttr(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.replace(/"/g, "&quot;");
}
