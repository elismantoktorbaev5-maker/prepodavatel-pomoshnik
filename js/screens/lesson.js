import { getGroup, listStudents, getAttendance, setAttendanceStatus, markAllPresent, todayISO, ATTENDANCE_LABELS } from "../repo.js";
import { createHintButton, setScreenTitle, showToast } from "../ui.js";

export const title = "Посещаемость";

const STATUSES = ["present", "absent", "late", "excused"];

export async function render(container, params) {
  const groupId = Number(params.id);
  container.innerHTML = "";

  const group = await getGroup(groupId);
  if (!group) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🤔</div><h2>Группа не найдена</h2></div>`;
    return;
  }
  setScreenTitle(group.name);

  let date = todayISO();

  const topCard = document.createElement("div");
  topCard.className = "card";
  topCard.innerHTML = `
    <div class="field" style="margin-bottom:0.6rem;">
      <label>Дата занятия <span></span></label>
      <input type="date" id="lesson-date" value="${date}">
    </div>
    <div style="display:flex; gap:0.5rem;">
      <button class="btn btn-primary" style="flex:1;" id="mark-all-btn">✅ Все пришли</button>
      <a class="btn" style="flex:1;text-decoration:none;color:inherit;text-align:center;" href="#/attendance-summary/${groupId}">📈 Итоги</a>
    </div>
  `;
  topCard.querySelector("label span").appendChild(
    createHintButton("Если хотите отметить прошлое занятие — выберите его дату здесь.")
  );
  container.appendChild(topCard);

  const students = await listStudents(groupId);

  const listWrap = document.createElement("div");
  container.appendChild(listWrap);

  if (!students.length) {
    listWrap.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<div class="empty-icon">🧑‍🎓</div><h2>В группе пока нет студентов</h2><p>Сначала добавьте список студентов.</p>`;
    const btn = document.createElement("a");
    btn.className = "btn btn-primary btn-lg";
    btn.href = `#/group/${groupId}`;
    btn.textContent = "Добавить студентов";
    empty.appendChild(btn);
    listWrap.appendChild(empty);
    return;
  }

  async function renderList() {
    listWrap.innerHTML = "";
    for (const s of students) {
      const card = document.createElement("div");
      card.className = "student-card";
      card.innerHTML = `<div class="student-card-name" style="margin-bottom:0.6rem;">${escapeHtml(s.fullName)}</div>`;
      const grid = document.createElement("div");
      grid.className = "attendance-grid";
      for (const status of STATUSES) {
        const btn = document.createElement("button");
        btn.dataset.status = status;
        btn.className = "status-" + status;
        btn.textContent = ATTENDANCE_LABELS[status];
        grid.appendChild(btn);
      }
      card.appendChild(grid);
      listWrap.appendChild(card);

      const current = await getAttendance(s.id, date);
      applySelection(grid, current ? current.status : null);

      grid.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const newStatus = await setAttendanceStatus(s.id, date, btn.dataset.status);
          applySelection(grid, newStatus);
        });
      });
    }
  }

  topCard.querySelector("#lesson-date").addEventListener("change", (e) => {
    date = e.target.value;
    renderList();
  });
  topCard.querySelector("#mark-all-btn").addEventListener("click", async () => {
    await markAllPresent(students, date);
    showToast("Отмечены все присутствующие");
    renderList();
  });

  await renderList();
}

function applySelection(grid, status) {
  grid.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.status === status);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
