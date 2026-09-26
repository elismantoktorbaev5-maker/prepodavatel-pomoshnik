// Работа с группами и студентами поверх IndexedDB.
import { db } from "./db.js";

export async function listGroups() {
  const groups = await db.getAll("groups");
  return groups.sort((a, b) => a.id - b.id);
}

export async function getGroup(id) {
  return db.get("groups", id);
}

export async function createGroup(name) {
  return db.put("groups", { name: name.trim() });
}

export async function renameGroup(id, name) {
  const g = await db.get("groups", id);
  if (!g) return;
  g.name = name.trim();
  await db.put("groups", g);
}

export async function deleteGroupCascade(id) {
  const students = await db.getAllByIndex("students", "groupId", id);
  for (const s of students) {
    await deleteStudentCascade(s.id);
  }
  const columns = await db.getAllByIndex("gradeColumns", "groupId", id);
  for (const c of columns) {
    await db.delete("gradeColumns", c.id);
  }
  await db.delete("groups", id);
}

export async function listStudents(groupId) {
  const students = await db.getAllByIndex("students", "groupId", groupId);
  return students.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
}

export async function countStudents(groupId) {
  const students = await db.getAllByIndex("students", "groupId", groupId);
  return students.length;
}

export async function addStudent(groupId, fullName) {
  const existing = await listStudents(groupId);
  const nextOrder = existing.length ? Math.max(...existing.map((s) => s.order ?? 0)) + 1 : 0;
  return db.put("students", { groupId, fullName: fullName.trim(), order: nextOrder });
}

export async function addStudentsBulk(groupId, namesText) {
  const names = namesText
    .split(/\r?\n/)
    .map((n) => n.replace(/^\s*\d+[.)]\s*/, "").trim()) // убираем "1. " или "1)" в начале строки
    .filter((n) => n.length > 0);
  const existing = await listStudents(groupId);
  let nextOrder = existing.length ? Math.max(...existing.map((s) => s.order ?? 0)) + 1 : 0;
  const created = [];
  for (const name of names) {
    const id = await db.put("students", { groupId, fullName: name, order: nextOrder++ });
    created.push(id);
  }
  return created.length;
}

// ===== Колонки оценок =====

const DEFAULT_COLUMNS = [
  { name: "Модуль 1", maxScore: 30 },
  { name: "Модуль 2", maxScore: 30 },
  { name: "Итоговый контроль", maxScore: 40 },
];

export async function listColumns(groupId) {
  const cols = await db.getAllByIndex("gradeColumns", "groupId", groupId);
  return cols.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
}

export async function ensureDefaultColumns(groupId) {
  const existing = await listColumns(groupId);
  if (existing.length) return existing;
  const created = [];
  for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
    const c = DEFAULT_COLUMNS[i];
    const id = await db.put("gradeColumns", { groupId, name: c.name, maxScore: c.maxScore, order: i });
    created.push({ id, groupId, ...c, order: i });
  }
  return created;
}

export async function createColumn(groupId, name, maxScore) {
  const existing = await listColumns(groupId);
  const order = existing.length ? Math.max(...existing.map((c) => c.order ?? 0)) + 1 : 0;
  return db.put("gradeColumns", { groupId, name: name.trim(), maxScore: Number(maxScore) || 0, order });
}

export async function updateColumn(id, { name, maxScore }) {
  const col = await db.get("gradeColumns", id);
  if (!col) return;
  if (name != null) col.name = name.trim();
  if (maxScore != null) col.maxScore = Number(maxScore) || 0;
  await db.put("gradeColumns", col);
}

export async function deleteColumnCascade(id) {
  const grades = await db.getAllByIndex("grades", "columnId", id);
  for (const g of grades) await db.delete("grades", g.id);
  await db.delete("gradeColumns", id);
}

// ===== Оценки =====

export async function getScore(studentId, columnId) {
  const row = await db.getByIndex("grades", "studentColumn", [studentId, columnId]);
  return row ? row.score : null;
}

export async function listScoresForStudent(studentId) {
  return db.getAllByIndex("grades", "studentId", studentId);
}

export async function setScore(studentId, columnId, score) {
  const existing = await db.getByIndex("grades", "studentColumn", [studentId, columnId]);
  if (score === null || score === "") {
    if (existing) await db.delete("grades", existing.id);
    return;
  }
  const value = Math.max(0, Number(score));
  if (existing) {
    existing.score = value;
    await db.put("grades", existing);
  } else {
    await db.put("grades", { studentId, columnId, score: value });
  }
}

// ===== Шкала итоговой оценки =====

export const DEFAULT_GRADE_SCALE = { excellent: 87, good: 74, pass: 61 };

export function computeGrade(total, scale) {
  const s = scale || DEFAULT_GRADE_SCALE;
  if (total >= s.excellent) return { tier: "excellent", label: "5 (отлично)" };
  if (total >= s.good) return { tier: "good", label: "4 (хорошо)" };
  if (total >= s.pass) return { tier: "pass", label: "3 (удовлетворительно)" };
  return { tier: "fail", label: "2 (неудовлетворительно)" };
}

// ===== Посещаемость =====

export function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

export const ATTENDANCE_LABELS = {
  present: "Был",
  absent: "Не был",
  late: "Опоздал",
  excused: "Уважительная",
};

export async function getAttendance(studentId, date) {
  return db.getByIndex("attendance", "studentDate", [studentId, date]);
}

export async function setAttendanceStatus(studentId, date, status) {
  const existing = await getAttendance(studentId, date);
  if (existing && existing.status === status) {
    await db.delete("attendance", existing.id);
    return null;
  }
  if (existing) {
    existing.status = status;
    await db.put("attendance", existing);
  } else {
    await db.put("attendance", { studentId, date, status });
  }
  return status;
}

export async function markAllPresent(students, date) {
  for (const s of students) {
    const existing = await getAttendance(s.id, date);
    if (existing) {
      existing.status = "present";
      await db.put("attendance", existing);
    } else {
      await db.put("attendance", { studentId: s.id, date, status: "present" });
    }
  }
}

export async function getAttendanceSummary(studentId) {
  const records = await db.getAllByIndex("attendance", "studentId", studentId);
  const summary = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const r of records) {
    if (summary[r.status] != null) summary[r.status]++;
  }
  return summary;
}

export async function renameStudent(id, fullName) {
  const s = await db.get("students", id);
  if (!s) return;
  s.fullName = fullName.trim();
  await db.put("students", s);
}

export async function deleteStudentCascade(id) {
  const grades = await db.getAllByIndex("grades", "studentId", id);
  for (const g of grades) await db.delete("grades", g.id);
  const att = await db.getAllByIndex("attendance", "studentId", id);
  for (const a of att) await db.delete("attendance", a.id);
  await db.delete("students", id);
}
