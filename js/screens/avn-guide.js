export const title = "Памятка: перенос в AVN";

const STEPS = [
  "На компьютере откройте сайт AVN и войдите под своим логином и паролем (как обычно).",
  "Откройте нужную группу и свой предмет — там, где обычно выставляете оценки.",
  "Если в AVN есть таблица с ячейками: откройте отправленный себе файл Excel или откройте сообщение со скопированной таблицей, выделите ячейки в AVN и вставьте (Ctrl+V).",
  "Если вставить нельзя — переносите баллы по одному студенту: держите телефон с приложением открытым рядом с компьютером.",
  "После заполнения обязательно нажмите «Сохранить» (или похожую кнопку) в самой AVN — иначе баллы не сохранятся.",
  "Обновите страницу AVN и проверьте, что баллы отобразились правильно.",
];

export async function render(container) {
  container.innerHTML = "";

  const intro = document.createElement("div");
  intro.className = "card";
  intro.innerHTML = `<p class="muted" style="margin:0;">Названия кнопок в AVN могут немного отличаться в зависимости от версии сайта — общий порядок действий такой:</p>`;
  container.appendChild(intro);

  const list = document.createElement("div");
  list.className = "install-steps";
  STEPS.forEach((text, i) => {
    const el = document.createElement("div");
    el.className = "install-step";
    el.innerHTML = `<span class="step-num">${i + 1}</span><span>${text}</span>`;
    list.appendChild(el);
  });
  container.appendChild(list);

  const tip = document.createElement("div");
  tip.className = "card";
  tip.style.marginTop = "0.75rem";
  tip.innerHTML = `<strong>Совет:</strong><p class="muted" style="margin:0.4rem 0 0;">Проще всего сначала нажать «Скопировать таблицу» в разделе AVN приложения, отправить её себе в Telegram, открыть на компьютере и вставить в AVN одним движением.</p>`;
  container.appendChild(tip);
}
