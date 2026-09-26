import { getGroup, listColumns, createColumn, updateColumn, deleteColumnCascade, DEFAULT_GRADE_SCALE } from "../repo.js";
import { db } from "../db.js";
import { createHintButton, confirmDialog, showToast, setScreenTitle } from "../ui.js";

export const title = "Колонки оценок";

export async function render(container, params) {
  const groupId = Number(params.id);
  container.innerHTML = "";

  const group = await getGroup(groupId);
  if (!group) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🤔</div><h2>Группа не найдена</h2></div>`;
    return;
  }
  setScreenTitle("Колонки: " + group.name);

  const headRow = document.createElement("div");
  headRow.style.display = "flex";
  headRow.style.alignItems = "center";
  headRow.style.gap = "0.4rem";
  headRow.style.marginBottom = "0.6rem";
  headRow.innerHTML = `<h3 style="flex:1;margin:0;">Колонки для «${escapeHtml(group.name)}»</h3>`;
  headRow.appendChild(createHintButton("Колонка — это часть оценки, например «Модуль 1». Максимум баллов — сколько баллов можно набрать максимум по этой колонке."));
  container.appendChild(headRow);

  const columns = await listColumns(groupId);

  for (const col of columns) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="field">
        <label>Название колонки</label>
        <input type="text" data-field="name" value="${escapeAttr(col.name)}">
      </div>
      <div class="field" style="margin-bottom:0.5rem;">
        <label>Максимум баллов</label>
        <input type="number" inputmode="numeric" data-field="max" value="${col.maxScore}">
      </div>
      <button class="btn btn-danger btn-block" data-action="delete">🗑 Удалить колонку</button>
    `;
    const nameInput = card.querySelector('[data-field="name"]');
    const maxInput = card.querySelector('[data-field="max"]');
    nameInput.addEventListener("change", async () => {
      if (!nameInput.value.trim()) { nameInput.value = col.name; return; }
      await updateColumn(col.id, { name: nameInput.value });
      showToast("Сохранено");
    });
    maxInput.addEventListener("change", async () => {
      const val = Number(maxInput.value);
      if (!val || val <= 0) { maxInput.value = col.maxScore; return; }
      await updateColumn(col.id, { maxScore: val });
      showToast("Сохранено");
    });
    card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
      const ok = await confirmDialog({
        title: "Удалить колонку?",
        message: `Колонка «${col.name}» и все внесённые по ней баллы будут удалены безвозвратно.`,
        confirmLabel: "Да, удалить",
      });
      if (!ok) return;
      await deleteColumnCascade(col.id);
      showToast("Колонка удалена");
      render(container, params);
    });
    container.appendChild(card);
  }

  const addCard = document.createElement("div");
  addCard.className = "card";
  addCard.innerHTML = `
    <h3 style="margin-top:0;">Добавить колонку</h3>
    <div class="field">
      <label>Название</label>
      <input type="text" id="new-col-name" placeholder="Например, Домашние задания">
    </div>
    <div class="field" style="margin-bottom:0.5rem;">
      <label>Максимум баллов</label>
      <input type="number" inputmode="numeric" id="new-col-max" placeholder="Например, 20">
    </div>
    <button class="btn btn-primary btn-block" id="add-col-btn">+ Добавить</button>
  `;
  addCard.querySelector("#add-col-btn").addEventListener("click", async () => {
    const nameEl = addCard.querySelector("#new-col-name");
    const maxEl = addCard.querySelector("#new-col-max");
    const name = nameEl.value.trim();
    const max = Number(maxEl.value);
    if (!name) { showToast("Введите название колонки"); return; }
    if (!max || max <= 0) { showToast("Укажите максимум баллов больше нуля"); return; }
    await createColumn(groupId, name, max);
    showToast("Колонка добавлена");
    render(container, params);
  });
  container.appendChild(addCard);

  // Шкала итоговой оценки
  const scale = await db.getSetting("gradeScale", { ...DEFAULT_GRADE_SCALE });
  const scaleCard = document.createElement("div");
  scaleCard.className = "card";
  const scaleHead = document.createElement("div");
  scaleHead.style.display = "flex";
  scaleHead.style.alignItems = "center";
  scaleHead.style.gap = "0.4rem";
  scaleHead.innerHTML = `<h3 style="flex:1;margin:0;">Шкала итоговой оценки</h3>`;
  scaleHead.appendChild(createHintButton("С какой суммы баллов ставится каждая оценка. Например: от 87 — «отлично», от 74 — «хорошо», от 61 — «удовлетворительно», меньше — «неудовлетворительно». Это общая настройка для всех групп."));
  scaleCard.appendChild(scaleHead);
  scaleCard.insertAdjacentHTML("beforeend", `
    <div class="field">
      <label>«Отлично» (5) от, баллов</label>
      <input type="number" inputmode="numeric" data-scale="excellent" value="${scale.excellent}">
    </div>
    <div class="field">
      <label>«Хорошо» (4) от, баллов</label>
      <input type="number" inputmode="numeric" data-scale="good" value="${scale.good}">
    </div>
    <div class="field" style="margin-bottom:0;">
      <label>«Удовлетворительно» (3) от, баллов</label>
      <input type="number" inputmode="numeric" data-scale="pass" value="${scale.pass}">
    </div>
  `);
  scaleCard.querySelectorAll("[data-scale]").forEach((input) => {
    input.addEventListener("change", async () => {
      const current = await db.getSetting("gradeScale", { ...DEFAULT_GRADE_SCALE });
      current[input.dataset.scale] = Number(input.value) || 0;
      await db.setSetting("gradeScale", current);
      showToast("Шкала сохранена");
    });
  });
  container.appendChild(scaleCard);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
