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

  function titleCase(value) {
    return value.toLowerCase().replace(/(^|\s)\S/g, function (m) {
      return m.toUpperCase();
    });
  }

  function convert(value, mode) {
    if (mode === "upper") return value.toUpperCase();
    if (mode === "lower") return value.toLowerCase();
    return titleCase(value);
  }

  async function loadSelection() {
    try {
      var selected = await exec("GetSelectedText", [{ Numbering: false }]);
      if (typeof selected === "string" && selected.trim()) {
        document.getElementById("inputText").value = selected;
      }
    } catch (error) {
      console.warn("GetSelectedText failed", error);
    }
  }

  async function insertToDocument() {
    var text = document.getElementById("inputText").value;
    if (!text.trim()) {
      return;
    }
    try {
      await exec("PasteText", [text]);
    } catch (error) {
      console.warn("PasteText failed", error);
    }
  }

  function bindUI() {
    var input = document.getElementById("inputText");
    document.querySelectorAll("button[data-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        input.value = convert(input.value, button.getAttribute("data-mode"));
      });
    });
    document.getElementById("fromSelection").addEventListener("click", loadSelection);
    document.getElementById("insertBack").addEventListener("click", insertToDocument);
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
