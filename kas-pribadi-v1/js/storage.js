const Storage = (() => {
  const KEY = "buku-kas-digital-v1";

  const defaults = () => ({
    version: 1,
    transactions: [],
    goal: { name: "Dana Darurat", target: 5000000 },
    budgets: {},
    templates: []
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      return {
        ...defaults(),
        ...parsed,
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        budgets: parsed.budgets && typeof parsed.budgets === "object" ? parsed.budgets : {},
        templates: Array.isArray(parsed.templates) ? parsed.templates : [],
        goal: parsed.goal && typeof parsed.goal === "object"
          ? { ...defaults().goal, ...parsed.goal }
          : defaults().goal
      };
    } catch (error) {
      console.error("Gagal membaca data lokal:", error);
      return defaults();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify({
      ...data,
      version: 1
    }));
  }

  function exportData(data) {
    const payload = {
      app: "Buku Kas Digital",
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buku-kas-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result);
          const data = payload.data || payload;
          if (!data || typeof data !== "object") throw new Error("Format backup tidak valid.");
          const normalized = {
            ...defaults(),
            ...data,
            transactions: Array.isArray(data.transactions) ? data.transactions : [],
            budgets: data.budgets && typeof data.budgets === "object" ? data.budgets : {},
            templates: Array.isArray(data.templates) ? data.templates : [],
            goal: data.goal && typeof data.goal === "object"
              ? { ...defaults().goal, ...data.goal }
              : defaults().goal
          };
          save(normalized);
          resolve(normalized);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("File backup tidak dapat dibaca."));
      reader.readAsText(file);
    });
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  return { load, save, exportData, importData, clear, key: KEY };
})();
