(function () {
  var quotes = [
    "Делай маленькие шаги, но каждый день.",
    "Простые решения масштабируются лучше сложных.",
    "Хороший интерфейс не требует объяснений.",
    "Стабильность важнее эффекта вау.",
    "Сначала работающий MVP, потом расширения."
  ];

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

  function nextQuote() {
    var index = Math.floor(Math.random() * quotes.length);
    document.getElementById("quoteText").value = quotes[index];
  }

  async function insertQuote() {
    var value = document.getElementById("quoteText").value;
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
    document.getElementById("nextQuote").addEventListener("click", nextQuote);
    document.getElementById("insertQuote").addEventListener("click", insertQuote);
    nextQuote();
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
