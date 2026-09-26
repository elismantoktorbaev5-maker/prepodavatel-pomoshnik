// Копирование текста и отправка файлов через меню телефона «Поделиться».

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export async function shareOrDownloadFile(file, { title = "", text = "" } = {}) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return "shared";
    } catch (err) {
      if (err && err.name === "AbortError") return "cancelled";
      // падаем на скачивание ниже
    }
  }
  downloadFile(file);
  return "downloaded";
}

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

let xlsxLoadPromise = null;
export function loadXlsxLib() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxLoadPromise) return xlsxLoadPromise;
  xlsxLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "js/vendor/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error("Не удалось загрузить модуль Excel. Проверьте интернет — он нужен только один раз."));
    document.head.appendChild(script);
  });
  return xlsxLoadPromise;
}
