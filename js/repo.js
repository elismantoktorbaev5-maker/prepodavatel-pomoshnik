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
