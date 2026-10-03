/* =========================================================
   Balaton Guide — interakciók
   Minden tartalom animáció nélkül is látható; a belépő
   effektek csak akkor rejtik el az elemet, ha ez a fájl
   sikeresen lefutott (a html `js` osztálya).
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(pointer: fine)");

  function revealAll() {
    document.querySelectorAll(".reveal, .reveal-img, .hero__title").forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  // globális hiba esetén soha ne maradjon rejtett tartalom
  window.addEventListener("error", function () {
    revealAll();
  });

  try {
    /* ---------- belépő animációk ---------- */
    var revealTargets = document.querySelectorAll(".reveal, .reveal-img");
    if ("IntersectionObserver" in window && !reduceMotion.matches) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      );
      revealTargets.forEach(function (el) {
        io.observe(el);
      });
      setTimeout(function () {
        // biztonsági háló: 3 mp után minden látható legyen
        revealTargets.forEach(function (el) {
          el.classList.add("is-in");
        });
      }, 3000);
    } else {
      revealTargets.forEach(function (el) {
        el.classList.add("is-in");
      });
    }

    var heroTitle = document.getElementById("hero-title");
    if (heroTitle) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          heroTitle.classList.add("is-in");
        });
      });
    }

    /* ---------- fejléc állapota ---------- */
    var header = document.getElementById("fejlec");
    var lastTicking = false;
    function onScrollHeader() {
      if (lastTicking) return;
      lastTicking = true;
      requestAnimationFrame(function () {
        if (header) header.classList.toggle("is-stuck", window.scrollY > 12);
        lastTicking = false;
      });
    }
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();

    /* ---------- mobil menü ---------- */
    var toggle = document.getElementById("menu-toggle");
    var menu = document.getElementById("mobil-menu");
    if (toggle && menu) {
      menu.removeAttribute("hidden");
      var openMenu = function () {
        menu.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Menü bezárása");
        document.body.classList.add("is-locked");
        var first = menu.querySelector("a");
        if (first) first.focus();
      };
      var closeMenu = function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Menü megnyitása");
        document.body.classList.remove("is-locked");
      };
      toggle.addEventListener("click", function () {
        if (toggle.getAttribute("aria-expanded") === "true") closeMenu();
        else openMenu();
      });
      menu.addEventListener("click", function (e) {
        if (e.target.closest("a")) closeMenu();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu.classList.contains("is-open")) {
          closeMenu();
          toggle.focus();
        }
      });
      window.addEventListener("resize", function () {
        if (window.innerWidth > 1024 && menu.classList.contains("is-open")) closeMenu();
      });
    }

    /* ---------- nyitóvizuál térbeli mozgása (csak egér) ---------- */
    var stage = document.getElementById("hero-stage");
    if (stage && finePointer.matches && !reduceMotion.matches) {
      var layers = stage.querySelectorAll("[data-depth]");
      var tx = 0, ty = 0, cx = 0, cy = 0, rafId = null;
      var loop = function () {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        layers.forEach(function (el) {
          var d = parseFloat(el.getAttribute("data-depth")) || 10;
          el.style.transform =
            "translate3d(" + (cx * d) / 100 + "px," + (cy * d) / 100 + "px,0)" +
            (el.classList.contains("hero__photo") ? " rotate(-1.4deg)" : "");
        });
        rafId = requestAnimationFrame(loop);
      };
      stage.addEventListener("pointermove", function (e) {
        var r = stage.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * 12;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2 * 12;
        if (!rafId) rafId = requestAnimationFrame(loop);
      });
      stage.addEventListener("pointerleave", function () {
        tx = 0;
        ty = 0;
      });
    }

    /* ---------- panoráma finom elmozdulása ---------- */
    var parallaxImg = document.querySelector("[data-parallax]");
    if (parallaxImg && !reduceMotion.matches) {
      var ticking = false;
      var updateParallax = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var box = parallaxImg.parentElement.getBoundingClientRect();
          var vh = window.innerHeight || 800;
          if (box.bottom > 0 && box.top < vh) {
            var p = (box.top + box.height / 2 - vh / 2) / vh; // -1..1
            parallaxImg.style.transform = "translate3d(0," + p * -8 + "%,0)";
          }
          ticking = false;
        });
      };
      window.addEventListener("scroll", updateParallax, { passive: true });
      updateParallax();
    }

    /* ---------- lapozó modál ---------- */
    var modal = document.getElementById("lapozo");
    if (modal) {
      var panel = modal.querySelector(".modal__panel");
      var flip = document.getElementById("flip");
      var pages = Array.prototype.slice.call(modal.querySelectorAll("[data-page]"));
      var count = document.getElementById("pager-count");
      var zoomBtn = document.getElementById("zoom-btn");
      var closeBtn = document.getElementById("close-btn");
      var prevBtn = document.getElementById("prev-btn");
      var nextBtn = document.getElementById("next-btn");
      var current = 0;
      var lastFocused = null;

      var setPage = function (i) {
        current = (i + pages.length) % pages.length;
        pages.forEach(function (p, idx) {
          p.classList.toggle("is-current", idx === current);
        });
        if (count) count.textContent = current + 1 + " / " + pages.length;
        if (prevBtn) prevBtn.disabled = false;
        var stage = document.getElementById("modal-stage");
        if (stage) stage.scrollTop = 0;
      };

      var focusables = function () {
        return Array.prototype.slice.call(
          panel.querySelectorAll('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter(function (el) {
          return el.offsetParent !== null;
        });
      };

      var openModal = function (startIndex) {
        lastFocused = document.activeElement;
        modal.hidden = false;
        modal.classList.add("is-open");
        document.body.classList.add("is-locked");
        setPage(startIndex || 0);
        if (zoomBtn) {
          zoomBtn.setAttribute("aria-pressed", "false");
          zoomBtn.textContent = "Nagyítás";
          if (flip) flip.classList.remove("is-zoomed");
        }
        (closeBtn || panel).focus();
      };

      var closeModal = function () {
        modal.classList.remove("is-open");
        modal.hidden = true;
        document.body.classList.remove("is-locked");
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      };

      document.querySelectorAll("[data-open-modal]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = parseInt(btn.getAttribute("data-page"), 10) || 0;
          openModal(idx);
        });
      });

      if (closeBtn) closeBtn.addEventListener("click", closeModal);
      if (prevBtn) prevBtn.addEventListener("click", function () { setPage(current - 1); });
      if (nextBtn) nextBtn.addEventListener("click", function () { setPage(current + 1); });

      if (zoomBtn && flip) {
        zoomBtn.addEventListener("click", function () {
          var zoomed = flip.classList.toggle("is-zoomed");
          zoomBtn.setAttribute("aria-pressed", zoomed ? "true" : "false");
          zoomBtn.textContent = zoomed ? "Kicsinyítés" : "Nagyítás";
        });
      }

      modal.addEventListener("mousedown", function (e) {
        if (e.target === modal) closeModal();
      });

      document.addEventListener("keydown", function (e) {
        if (modal.hidden) return;
        if (e.key === "Escape") { closeModal(); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); setPage(current + 1); return; }
        if (e.key === "ArrowLeft") { e.preventDefault(); setPage(current - 1); return; }
        if (e.key === "Tab") {
          var list = focusables();
          if (!list.length) return;
          var first = list[0], last = list[list.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }

    /* ---------- kapcsolat űrlap ---------- */
    var form = document.getElementById("kapcsolat-form");
    if (form) {
      var status = document.getElementById("form-status");
      var setError = function (input, msgId, msg) {
        var box = document.getElementById(msgId);
        if (box) box.textContent = msg || "";
        if (msg) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
        return !msg;
      };

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var nev = form.elements["nev"];
        var email = form.elements["email"];
        var tel = form.elements["telefon"];
        var uz = form.elements["uzenet"];

        var ok = true;
        ok = setError(nev, "e-nev", nev.value.trim().length < 2 ? "Kérjük, add meg a neved." : "") && ok;
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
        ok = setError(email, "e-email", emailOk ? "" : "Érvényes e-mail-címet adj meg.") && ok;

        var telVal = tel.value.trim();
        var telOk = telVal === "" || /^[+0-9\s()/–-]{6,}$/.test(telVal);
        ok = setError(tel, "e-tel", telOk ? "" : "Csak számokat, szóközt és + jelet használj.") && ok;

        ok = setError(uz, "e-uzenet", uz.value.trim().length < 10 ? "Írj néhány mondatot az elképzelésről." : "") && ok;

        if (!ok) {
          var firstInvalid = form.querySelector('[aria-invalid="true"]');
          if (firstInvalid) firstInvalid.focus();
          if (status) status.textContent = "Van hiányos vagy hibás mező — javítsd ki, majd próbáld újra. Adat nem került elküldésre.";
          return;
        }

        var lines = [
          "Név: " + nev.value.trim(),
          "E-mail: " + email.value.trim(),
          telVal ? "Telefonszám: " + telVal : "Telefonszám: nincs megadva",
          "",
          "Üzenet:",
          uz.value.trim(),
          "",
          "—",
          "Ezt a levelet a Balaton Guide látványterv űrlapja állította össze (nincs szerveroldali küldés)."
        ];
        var href =
          "mailto:print.makka@gmail.com" +
          "?subject=" + encodeURIComponent("Balaton Guide megkeresés — " + nev.value.trim()) +
          "&body=" + encodeURIComponent(lines.join("\n"));

        if (status) {
          status.textContent =
            "Elkészült az előre kitöltött levél — a levelezőprogramod nyílik meg. Innen nem küldünk adatot: a levelet te tudod elküldeni. Ha nem nyílt meg, írj közvetlenül: print.makka@gmail.com";
        }
        window.location.href = href;
      });

      form.addEventListener("input", function (e) {
        if (e.target.hasAttribute("aria-invalid")) {
          e.target.removeAttribute("aria-invalid");
          var box = e.target.getAttribute("aria-describedby");
          if (box) {
            var el = document.getElementById(box.split(" ").pop());
            if (el && el.classList.contains("field__error")) el.textContent = "";
          }
        }
      });
    }

    /* ---------- sima belső görgetés (csak mozgás engedélyezve) ---------- */
    if (!reduceMotion.matches && "IntersectionObserver" in window) {
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          if (id.length < 2) return;
          var target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          if (history.replaceState) history.replaceState(null, "", id);
        });
      });
    }
  } catch (err) {
    revealAll();
    if (window.console) console.error(err);
  }
})();
