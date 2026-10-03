/* =========================================================
   Balaton Guide — ÜGYFÉLFELÜLET-KONCEPCIÓ (demó)
   Nincs hálózati kérés, nincs mentés, nincs belépés.
   ========================================================= */
(function () {
  "use strict";

  try {
    /* ---------- lapok (tabok) ---------- */
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('[role="tabpanel"]'));

    function selectTab(tab, focus) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.setAttribute("aria-selected", active ? "true" : "false");
        t.tabIndex = active ? 0 : -1;
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.id === tab.getAttribute("aria-controls"));
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.tabIndex = i === 0 ? 0 : -1;
      tab.addEventListener("click", function () {
        selectTab(tab, false);
      });
      tab.addEventListener("keydown", function (e) {
        var idx = tabs.indexOf(tab);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          selectTab(tabs[(idx + 1) % tabs.length], true);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          selectTab(tabs[(idx - 1 + tabs.length) % tabs.length], true);
        } else if (e.key === "Home") {
          e.preventDefault();
          selectTab(tabs[0], true);
        } else if (e.key === "End") {
          e.preventDefault();
          selectTab(tabs[tabs.length - 1], true);
        }
      });
    });

    /* ---------- helyi fájelőnézet (nincs feltöltés) ---------- */
    var input = document.getElementById("file-input");
    var drop = document.getElementById("drop");
    var preview = document.getElementById("preview");
    var body = document.getElementById("preview-body");
    var nameEl = document.getElementById("file-name");
    var metaEl = document.getElementById("file-meta");
    var clearBtn = document.getElementById("clear-file");
    var currentUrl = null;

    function clearFile() {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
        currentUrl = null;
      }
      if (input) input.value = "";
      if (preview) preview.classList.remove("is-visible");
      if (body) body.innerHTML = "";
    }

    function showFile(file) {
      if (!file || !preview || !body) return;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
        currentUrl = null;
      }
      nameEl.textContent = file.name;
      metaEl.textContent = "csak helyi előnézet · nem került feltöltésre";
      body.innerHTML = "";

      if (file.type && file.type.indexOf("image/") === 0) {
        currentUrl = URL.createObjectURL(file);
        var img = document.createElement("img");
        img.alt = "A kiválasztott fájl helyi előnézete: " + file.name;
        img.src = currentUrl;
        body.appendChild(img);
      } else {
        var p = document.createElement("p");
        p.className = "noimg";
        p.textContent =
          "„" + file.name + "” — a fájl neve és mérete helyben megjelenik, de ebben a látványtervben nincs szerver, ahová feltölthetnénk. Csak képeknél van vizuális előnézet.";
        body.appendChild(p);
      }
      preview.classList.add("is-visible");
    }

    if (input) {
      input.addEventListener("change", function () {
        if (input.files && input.files[0]) showFile(input.files[0]);
      });
    }

    if (clearBtn) clearBtn.addEventListener("click", clearFile);

    if (drop) {
      ["dragenter", "dragover"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          drop.classList.add("is-over");
        });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          drop.classList.remove("is-over");
        });
      });
      drop.addEventListener("drop", function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) showFile(f);
      });
    }

    /* ---------- kiadványterv lapozása ---------- */
    var spreads = Array.prototype.slice.call(document.querySelectorAll("[data-spread]"));
    var spreadCount = document.getElementById("spread-count");
    var prev = document.getElementById("spread-prev");
    var next = document.getElementById("spread-next");
    var current = 0;

    function setSpread(i) {
      if (!spreads.length) return;
      current = (i + spreads.length) % spreads.length;
      spreads.forEach(function (s, idx) {
        s.classList.toggle("is-current", idx === current);
      });
      if (spreadCount) spreadCount.textContent = current + 1 + " / " + spreads.length;
    }

    if (prev) prev.addEventListener("click", function () { setSpread(current - 1); });
    if (next) next.addEventListener("click", function () { setSpread(current + 1); });

    /* ---------- visszajelzés (kizárólag helyben) ---------- */
    var addBtn = document.getElementById("add-comment");
    var textarea = document.getElementById("demo-comment");
    var thread = document.getElementById("thread");
    var approveBtn = document.getElementById("approve-btn");
    var approveState = document.getElementById("approve-state");
    var actionNote = document.getElementById("action-note");

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        var value = (textarea.value || "").trim();
        if (value.length < 3) {
          textarea.focus();
          if (actionNote) {
            actionNote.textContent =
              "Írj néhány szót a megjegyzéshez. Semmi nem kerül elküldésre vagy mentésre.";
          }
          return;
        }
        var note = document.createElement("article");
        note.className = "note note--new";
        var head = document.createElement("p");
        head.className = "note__head";
        var who = document.createElement("span");
        who.textContent = "Te (demó)";
        var when = document.createElement("span");
        when.textContent = "helyi megjegyzés · nincs elküldve";
        head.appendChild(who);
        head.appendChild(when);
        var text = document.createElement("p");
        text.textContent = value;
        note.appendChild(head);
        note.appendChild(text);
        thread.appendChild(note);
        textarea.value = "";
        if (actionNote) {
          actionNote.textContent =
            "A megjegyzés csak ebben a böngészőben, ebben a munkamenetben jelent meg. Nem mentődik és nem küldődik el.";
        }
        note.scrollIntoView({ block: "nearest" });
      });
    }

    var approved = false;
    if (approveBtn) {
      approveBtn.addEventListener("click", function () {
        approved = !approved;
        approveState.textContent = approved
          ? "Jelzve (csak a bemutatóban)"
          : "Jóváhagyásra vár · demó";
        approveState.className = approved
          ? "status status--ok"
          : "status status--wait";
        approveBtn.textContent = approved
          ? "Jelzés visszavonása"
          : "Jóváhagyás jelzése";
        if (actionNote) {
          actionNote.textContent = approved
            ? "Ez a jelzés kizárólag a bemutatóban létezik: nem került mentésre, nem jár valós jóváhagyással, és senki nem kap róla értesítést."
            : "A műveletek csak ebben a böngészőben, a bemutató kedvéért futnak. Nem mentődik, nem küldődik el, és nem jár valós jóváhagyással.";
        }
      });
    }
  } catch (err) {
    if (window.console) console.error(err);
  }
})();
