import { getGroup } from "../repo.js";
import { getAvnColumnConfig, saveAvnColumnConfig } from "../avn.js";
import { createHintButton, setScreenTitle, showToast } from "../ui.js";

export const title = "Порядок колонок AVN";

export async function render(container, params) {
  const groupId = Number(params.id);
  container.innerHTML = "";

  const group = await getGroup(groupId);
  if (!group) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🤔</div><h2>Группа не найдена</h2></div>`;
    return;
  }
  setScreenTitle("Колонки AVN: " + group.name);

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "0.4rem";
  head.style.marginBottom = "0.6rem";
  head.innerHTML = `<h3 style="flex:1;margin:0;">В каком порядке идут колонки в AVN?</h3>`;
  head.appendChild(createHintButton("Стрелками поменяйте порядок так же, как в AVN. Галочкой можно убрать колонку из таблицы, если в AVN её нет."));
  container.appendChild(head);

  let config = await getAvnColumnConfig(groupId);

  const listWrap = document.createElement("div");
  container.appendChild(listWrap);

  async function persist() {
    await saveAvnColumnConfig(groupId, config);
  }

  function renderList() {
    listWrap.innerHTML = "";

    const fixedItem = config.find((i) => i.type === "name");
    if (fixedItem) {
      const row = document.createElement("div");
      row.className = "card";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "0.6rem";
      row.innerHTML = `<div style="flex:1;font-weight:700;">${escapeHtml(fixedItem.label)}</div><span class="badge">Всегда первая</span>`;
      listWrap.appendChild(row);
    }

    const rest = config.filter((i) => i.type !== "name");
    rest.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "card";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "0.5rem";

      const checkboxWrap = document.createElement("label");
      checkboxWrap.style.display = "flex";
      checkboxWrap.style.alignItems = "center";
      checkboxWrap.style.gap = "0.5rem";
      checkboxWrap.style.flex = "1";
      checkboxWrap.innerHTML = `<input type="checkbox" style="width:22px;height:22px;" ${item.include ? "checked" : ""}> <span>${escapeHtml(item.label)}</span>`;
      checkboxWrap.querySelector("input").addEventListener("change", async (e) => {
        item.include = e.target.checked;
        await persist();
      });
      row.appendChild(checkboxWrap);

      const upBtn = document.createElement("button");
      upBtn.className = "btn";
      upBtn.style.minHeight = "44px";
      upBtn.style.padding = "0.4rem 0.7rem";
      upBtn.textContent = "▲";
      upBtn.disabled = index === 0;
      upBtn.addEventListener("click", async () => {
        [rest[index - 1], rest[index]] = [rest[index], rest[index - 1]];
        config = [fixedItem, ...rest];
        await persist();
        renderList();
      });
      row.appendChild(upBtn);

      const downBtn = document.createElement("button");
      downBtn.className = "btn";
      downBtn.style.minHeight = "44px";
      downBtn.style.padding = "0.4rem 0.7rem";
      downBtn.textContent = "▼";
      downBtn.disabled = index === rest.length - 1;
      downBtn.addEventListener("click", async () => {
        [rest[index + 1], rest[index]] = [rest[index], rest[index + 1]];
        config = [fixedItem, ...rest];
        await persist();
        renderList();
      });
      row.appendChild(downBtn);

      listWrap.appendChild(row);
    });
  }

  renderList();

  const doneBtn = document.createElement("a");
  doneBtn.className = "btn btn-primary btn-block btn-lg";
  doneBtn.style.marginTop = "0.5rem";
  doneBtn.style.textDecoration = "none";
  doneBtn.style.color = "var(--color-primary-contrast)";
  doneBtn.style.display = "block";
  doneBtn.style.textAlign = "center";
  doneBtn.href = `#/avn-export/${groupId}`;
  doneBtn.textContent = "Готово — вернуться к таблице";
  container.appendChild(doneBtn);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
