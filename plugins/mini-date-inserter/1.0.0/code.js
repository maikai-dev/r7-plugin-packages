(function () {
  function exec(method, args) {
    return new Promise(function (resolve, reject) {
      if (!window.Asc || !window.Asc.plugin || typeof window.Asc.plugin.executeMethod !== "function") {
        reject(new Error("R7 API unavailable"));
        return;
      }
      try {
        window.Asc.plugin.executeMethod(method, args || [], function (result) {
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function formatDate(mode) {
    var now = new Date();
    if (mode === "ru") {
      return now.toLocaleDateString("ru-RU");
    }
    if (mode === "full") {
      return now.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return now.toISOString().slice(0, 10);
  }

  function refreshPreview() {
    var mode = document.getElementById("formatSelect").value;
    document.getElementById("preview").value = formatDate(mode);
  }

  async function insertDate() {
    var value = document.getElementById("preview").value;
    if (!value) {
      return;
    }
    try {
      await exec("PasteText", [value]);
    } catch (error) {
      console.warn("PasteText failed", error);
    }
  }

  function bindUI() {
    document.getElementById("formatSelect").addEventListener("change", refreshPreview);
    document.getElementById("refresh").addEventListener("click", refreshPreview);
    document.getElementById("insert").addEventListener("click", insertDate);
    refreshPreview();
  }

  window.Asc = window.Asc || {};
  window.Asc.plugin = window.Asc.plugin || {};
  window.Asc.plugin.init = function () {
    bindUI();
  };
  window.Asc.plugin.button = function () {
    this.executeCommand("close", "");
  };
}());
