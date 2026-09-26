import { getGroup, listStudents, listColumns, ensureDefaultColumns, getScore, setScore, computeGrade, DEFAULT_GRADE_SCALE } from "../repo.js";
import { db } from "../db.js";
import { createHintButton, setScreenTitle, showToast } from "../ui.js";

export const title = "Оценки";

export async function render(container, params) {
  const groupId = Number(params.id);
  container.innerHTML = "";

  const group = await getGroup(groupId);
  if (!group) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🤔</div><h2>Группа не найдена</h2></div>`;
    return;
  }
  setScreenTitle(group.name);

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "0.5rem";
  actions.style.marginBottom = "0.9rem";
  actions.innerHTML = `
    <a class="btn" style="flex:1;text-decoration:none;color:inherit;" href="#/group/${groupId}">📋 Список группы</a>
    <a class="btn" style="flex:1;text-decoration:none;color:inherit;" href="#/grade-columns/${groupId}">⚙️ Колонки</a>
  `;
  container.appendChild(actions);

  const students = await listStudents(groupId);
  if (!students.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">🧑‍🎓</div>
      <h2>В группе пока нет студентов</h2>
      <p>Сначала добавьте список студентов.</p>
    `;
    const btn = document.createElement("a");
    btn.className = "btn btn-primary btn-lg";
    btn.href = `#/group/${groupId}`;
    btn.textContent = "Добавить студентов";
    empty.appendChild(btn);
    container.appendChild(empty);
    return;
  }

  let columns = await ensureDefaultColumns(groupId);
  columns = await listColumns(groupId);

  const scale = await db.getSetting("gradeScale", { ...DEFAULT_GRADE_SCALE });
  const maxTotal = columns.reduce((sum, c) => sum + (c.maxScore || 0), 0);

  const hintRow = document.createElement("div");
  hintRow.style.display = "flex";
  hintRow.style.alignItems = "center";
  hintRow.style.gap = "0.4rem";
  hintRow.style.marginBottom = "0.5rem";
  hintRow.innerHTML = `<span class="muted">Максимум за все колонки: ${maxTotal}</span>`;
  hintRow.appendChild(createHintButton("Введите баллы студента по каждой колонке. Сумма и итоговая оценка посчитаются сами. Красным подсвечены те, у кого недостаточно баллов."));
  container.appendChild(hintRow);

  for (const student of students) {
    const card = document.createElement("div");
    card.className = "student-card";

    const headEl = document.createElement("div");
    headEl.className = "student-card-head";
    headEl.innerHTML = `<div class="student-card-name">${escapeHtml(student.fullName)}</div>`;
    const badge = document.createElement("span");
    headEl.appendChild(badge);
    card.appendChild(headEl);

    const grid = document.createElement("div");
    grid.className = "score-grid";

    const inputs = [];
    for (const col of columns) {
      const cell = document.createElement("div");
      cell.className = "score-cell";
      const label = document.createElement("label");
      label.textContent = `${col.name} (из ${col.maxScore})`;
      cell.appendChild(label);
      const input = document.createElement("input");
      input.className = "score-input";
      input.type = "number";
      input.inputMode = "decimal";
      input.min = "0";
      input.max = String(col.maxScore);
      input.placeholder = "-";
      cell.appendChild(input);
      grid.appendChild(cell);
      inputs.push({ col, input });
    }
    card.appendChild(grid);
    container.appendChild(card);

    // Загружаем текущие баллы и считаем сумму
    async function refreshTotal() {
      let total = 0;
      for (const { input } of inputs) {
        const v = parseFloat(input.value);
        if (!isNaN(v)) total += v;
      }
      const grade = computeGrade(total, scale);
      badge.className = "badge " + badgeClassFor(grade.tier);
      badge.textContent = `${total} / ${maxTotal} · ${grade.label}`;
    }

    for (const { col, input } of inputs) {
      const current = await getScore(student.id, col.id);
      input.value = current == null ? "" : String(current);

      input.addEventListener("input", () => {
        refreshTotal();
      });
      input.addEventListener("change", async () => {
        let val = input.value === "" ? null : parseFloat(input.value);
        if (val != null && isNaN(val)) val = null;
        if (val != null && val > col.maxScore) {
          val = col.maxScore;
          input.value = String(val);
          showToast(`Максимум по колонке «${col.name}» — ${col.maxScore} баллов`);
        }
        if (val != null && val < 0) {
          val = 0;
          input.value = "0";
        }
        await setScore(student.id, col.id, val);
        refreshTotal();
      });
    }
    refreshTotal();
  }
}

function badgeClassFor(tier) {
  if (tier === "excellent" || tier === "good") return "badge-success";
  if (tier === "pass") return "badge-warning";
  return "badge-danger";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
