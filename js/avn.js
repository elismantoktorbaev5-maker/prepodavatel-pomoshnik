// Настройки и подготовка данных для раздела AVN.
import { db } from "./db.js";
import { listColumns, listStudents, getScore, computeGrade, DEFAULT_GRADE_SCALE } from "./repo.js";

export async function getAvnUrl() {
  return db.getSetting("avnUrl", "");
}
export async function setAvnUrl(url) {
  return db.setSetting("avnUrl", url.trim());
}

const DEFAULT_DEADLINES = { module1: "", module2: "", final: "" };
export async function getModuleDeadlines() {
  return db.getSetting("moduleDeadlines", { ...DEFAULT_DEADLINES });
}
export async function setModuleDeadlines(obj) {
  return db.setSetting("moduleDeadlines", obj);
}

function configKey(groupId) {
  return "avnColumns:" + groupId;
}

function defaultConfig(columns) {
  const items = [{ key: "name", type: "name", label: "ФИО", include: true, fixed: true }];
  for (const c of columns) {
    items.push({ key: "col:" + c.id, type: "column", columnId: c.id, label: c.name, include: true });
  }
  items.push({ key: "total", type: "total", label: "Сумма", include: true });
  items.push({ key: "grade", type: "grade", label: "Итоговая оценка", include: true });
  return items;
}

export async function getAvnColumnConfig(groupId) {
  const columns = await listColumns(groupId);
  const saved = await db.getSetting(configKey(groupId), null);
  if (!saved) {
    return defaultConfig(columns);
  }
  // Убираем колонки, которых больше нет; добавляем новые в конец.
  const validColumnIds = new Set(columns.map((c) => c.id));
  const filtered = saved.filter((item) => item.type !== "column" || validColumnIds.has(item.columnId));
  const presentColumnIds = new Set(filtered.filter((i) => i.type === "column").map((i) => i.columnId));
  for (const c of columns) {
    if (!presentColumnIds.has(c.id)) {
      filtered.push({ key: "col:" + c.id, type: "column", columnId: c.id, label: c.name, include: true });
    }
  }
  if (!filtered.some((i) => i.type === "name")) {
    filtered.unshift({ key: "name", type: "name", label: "ФИО", include: true, fixed: true });
  }
  return filtered;
}

export async function saveAvnColumnConfig(groupId, items) {
  return db.setSetting(configKey(groupId), items);
}

export async function buildAvnTable(groupId) {
  const config = (await getAvnColumnConfig(groupId)).filter((i) => i.include);
  const students = await listStudents(groupId);
  const columns = await listColumns(groupId);
  const columnMap = new Map(columns.map((c) => [c.id, c]));
  const scale = await db.getSetting("gradeScale", { ...DEFAULT_GRADE_SCALE });

  const headers = config.map((i) => (i.type === "column" ? columnMap.get(i.columnId)?.name || i.label : i.label));

  const rows = [];
  for (const s of students) {
    const scoresByColumn = {};
    let total = 0;
    for (const c of columns) {
      const score = await getScore(s.id, c.id);
      scoresByColumn[c.id] = score;
      if (score != null) total += score;
    }
    const grade = computeGrade(total, scale);
    const row = config.map((item) => {
      if (item.type === "name") return s.fullName;
      if (item.type === "column") {
        const v = scoresByColumn[item.columnId];
        return v == null ? "" : v;
      }
      if (item.type === "total") return total;
      if (item.type === "grade") return grade.label;
      return "";
    });
    rows.push(row);
  }

  return { headers, rows };
}
