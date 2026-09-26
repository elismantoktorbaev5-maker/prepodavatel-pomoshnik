import { getGroup } from "../repo.js";
import { buildAvnTable } from "../avn.js";
import { copyText, shareOrDownloadFile, loadXlsxLib } from "../share.js";
import { createHintButton, setScreenTitle, showToast, showError } from "../ui.js";

export const title = "Оценки для AVN";

export async function render(container, params) {
  const groupId = Number(params.id);
  container.innerHTML = "";

  const group = await getGroup(groupId);
  if (!group) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🤔</div><h2>Группа не найдена</h2></div>`;
    return;
  }
  setScreenTitle("AVN: " + group.name);

  const actions = document.createElement("div");
  actions.innerHTML = `<a class="btn btn-block" style="text-decoration:none;color:inherit;margin-bottom:0.75rem;" href="#/avn-columns/${groupId}">⚙️ Настроить порядок колонок</a>`;
  container.appendChild(actions);

  const { headers, rows } = await buildAvnTable(groupId);

  if (!rows.length) {
    container.innerHTML += `<div class="empty-state"><div class="empty-icon">🧑‍🎓</div><h2>В группе пока нет студентов</h2></div>`;
    return;
  }

  const previewHead = document.createElement("div");
  previewHead.style.display = "flex";
  previewHead.style.alignItems = "center";
  previewHead.style.gap = "0.4rem";
  previewHead.innerHTML = `<h3 style="flex:1;margin:0;">Предпросмотр таблицы</h3>`;
  previewHead.appendChild(createHintButton("Так будет выглядеть таблица. Листайте её в сторону, если она не помещается на экране."));
  container.appendChild(previewHead);

  const tableWrap = document.createElement("div");
  tableWrap.style.overflowX = "auto";
  tableWrap.style.margin = "0.6rem 0 1rem";
  tableWrap.style.background = "var(--color-surface)";
  tableWrap.style.borderRadius = "14px";
  tableWrap.style.boxShadow = "0 2px 10px var(--color-shadow)";
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";
  table.style.fontSize = "0.85rem";
  const thead = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.padding = "0.6rem 0.7rem";
    th.style.textAlign = "left";
    th.style.borderBottom = "2px solid var(--color-border)";
    th.style.whiteSpace = "nowrap";
    thead.appendChild(th);
  });
  table.appendChild(thead);
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      td.style.padding = "0.5rem 0.7rem";
      td.style.borderBottom = "1px solid var(--color-border)";
      td.style.whiteSpace = "nowrap";
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  tableWrap.appendChild(table);
  container.appendChild(tableWrap);

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn btn-primary btn-block btn-lg";
  copyBtn.style.marginBottom = "0.6rem";
  copyBtn.textContent = "📋 Скопировать таблицу";
  copyBtn.addEventListener("click", async () => {
    const text = [headers, ...rows].map((r) => r.join("\t")).join("\n");
    const ok = await copyText(text);
    if (ok) {
      showToast("Скопировано! Теперь вставьте (нажмите и удерживайте) в AVN или в Excel");
    } else {
      showError("Не удалось скопировать. Попробуйте отправить файл Excel вместо этого.");
    }
  });
  container.appendChild(copyBtn);

  const excelBtn = document.createElement("button");
  excelBtn.className = "btn btn-block btn-lg";
  excelBtn.textContent = "📤 Отправить файл Excel";
  excelBtn.addEventListener("click", async () => {
    excelBtn.disabled = true;
    const originalText = excelBtn.textContent;
    excelBtn.textContent = "Готовим файл…";
    try {
      const XLSX = await loadXlsxLib();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Оценки");
      const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const fileName = sanitizeFileName(group.name) + "-otsenki.xlsx";
      const file = new File([arrayBuffer], fileName, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const result = await shareOrDownloadFile(file, { title: "Оценки для AVN — " + group.name });
      if (result === "downloaded") {
        showToast("Файл скачан. Найдите его в «Файлах» и отправьте через «Поделиться»");
      } else if (result === "shared") {
        showToast("Файл отправлен");
      }
    } catch (err) {
      console.error(err);
      showError(err.message || "Не получилось подготовить файл. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      excelBtn.disabled = false;
      excelBtn.textContent = originalText;
    }
  });
  container.appendChild(excelBtn);
}

function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "gruppa";
}
