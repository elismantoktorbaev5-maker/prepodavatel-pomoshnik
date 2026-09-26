import { getGroup, listStudents, getAttendanceSummary } from "../repo.js";
import { createHintButton, setScreenTitle } from "../ui.js";

export const title = "Итоги посещаемости";

export async function render(container, params) {
  const groupId = Number(params.id);
  container.innerHTML = "";

  const group = await getGroup(groupId);
  if (!group) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🤔</div><h2>Группа не найдена</h2></div>`;
    return;
  }
  setScreenTitle("Итоги: " + group.name);

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "0.5rem";
  head.style.marginBottom = "0.75rem";
  head.innerHTML = `<h3 style="flex:1;margin:0;">Пропуски по студентам</h3>`;
  head.appendChild(createHintButton("«Не был» считается пропуском. «Опоздал» и «Уважительная» показаны отдельно и не входят в счётчик пропусков."));
  container.appendChild(head);

  const students = await listStudents(groupId);
  if (!students.length) {
    container.innerHTML += `<div class="empty-state"><div class="empty-icon">🧑‍🎓</div><h2>В группе пока нет студентов</h2></div>`;
    return;
  }

  for (const s of students) {
    const summary = await getAttendanceSummary(s.id);
    const card = document.createElement("div");
    card.className = "student-card";
    const badgeClass = summary.absent >= 3 ? "badge-danger" : summary.absent > 0 ? "badge-warning" : "badge-success";
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
        <div class="student-card-name">${escapeHtml(s.fullName)}</div>
        <span class="badge ${badgeClass}">Пропусков: ${summary.absent}</span>
      </div>
      <div class="muted" style="margin-top:0.4rem;">Был: ${summary.present} · Опоздал: ${summary.late} · Уважительная: ${summary.excused}</div>
    `;
    container.appendChild(card);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
