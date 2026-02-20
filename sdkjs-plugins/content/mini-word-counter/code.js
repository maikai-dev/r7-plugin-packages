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

  function countText(text) {
    var normalized = (text || "").trim();
    var words = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
    return {
      words: words,
      chars: (text || "").length,
      charsNoSpace: (text || "").replace(/\s+/g, "").length
    };
  }

  function renderStats(stats) {
    document.getElementById("words").textContent = String(stats.words);
    document.getElementById("chars").textContent = String(stats.chars);
    document.getElementById("charsNoSpace").textContent = String(stats.charsNoSpace);
  }

  async function fillFromSelection() {
    var input = document.getElementById("inputText");
    try {
      var selected = await exec("GetSelectedText", [{ Numbering: false }]);
      if (typeof selected === "string" && selected.trim()) {
        input.value = selected;
      }
    } catch (error) {
      console.warn("GetSelectedText failed", error);
    }
  }

  function initUI() {
    var input = document.getElementById("inputText");
    document.getElementById("fromSelection").addEventListener("click", fillFromSelection);
    document.getElementById("countBtn").addEventListener("click", function () {
      renderStats(countText(input.value));
    });
    input.addEventListener("input", function () {
      renderStats(countText(input.value));
    });
  }

  window.Asc = window.Asc || {};
  window.Asc.plugin = window.Asc.plugin || {};
  window.Asc.plugin.init = function () {
    initUI();
  };
  window.Asc.plugin.button = function () {
    this.executeCommand("close", "");
  };
}());
