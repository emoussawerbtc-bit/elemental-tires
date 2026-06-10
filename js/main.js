/* =============================================================
   ELEMENTAL TIRES — main.js
   Shared JS: nav, lang toggle, scroll bar, reveals, tabs, search
   ============================================================= */
(function () {
  "use strict";

  /* ── helpers ── */
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ─────────────────────────────────────────────
     LANG SYSTEM
  ───────────────────────────────────────────── */
  function setLang(lang) {
    localStorage.setItem("et_lang", lang);
    $$("[data-es]").forEach(function (el) {
      var val = el.getAttribute("data-" + lang);
      if (val === null) return;
      /* Use innerHTML to support <br> and <em> in translations */
      if (val.indexOf("<") !== -1) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    $$("[data-es-placeholder]").forEach(function (el) {
      var val = el.getAttribute("data-" + lang + "-placeholder");
      if (val !== null) el.placeholder = val;
    });
    $$(".lang-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "es");
  }

  function initLang() {
    var lang = localStorage.getItem("et_lang") || "es";
    setLang(lang);
    $$(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.dataset.lang);
      });
    });
  }

  /* ─────────────────────────────────────────────
     SCROLL PROGRESS BAR
  ───────────────────────────────────────────── */
  function initScrollBar() {
    var bar = $("#scroll-bar");
    if (!bar) return;
    window.addEventListener("scroll", function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + "%";
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────
     NAV
  ───────────────────────────────────────────── */
  function initNav() {
    var nav = $(".nav");
    if (!nav) return;

    /* active link */
    var path = window.location.pathname.split("/").pop() || "index.html";
    $$(".nav__links a, .nav__drawer a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });

    /* hamburger */
    var ham = $(".nav__hamburger");
    var drawer = $(".nav__drawer");
    if (ham && drawer) {
      ham.addEventListener("click", function () {
        ham.classList.toggle("is-open");
        drawer.classList.toggle("is-open");
      });
      drawer.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          ham.classList.remove("is-open");
          drawer.classList.remove("is-open");
        });
      });
    }

    /* shadow on scroll */
    window.addEventListener("scroll", function () {
      nav.style.boxShadow = window.scrollY > 10 ? "0 2px 20px rgba(0,0,0,.5)" : "none";
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────
     SCROLL REVEALS
  ───────────────────────────────────────────── */
  function initReveals() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -2% 0px" });

    $$(".reveal").forEach(function (el) { io.observe(el); });

    /* safety: force-reveal after 6s */
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight + 100) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ─────────────────────────────────────────────
     GSAP SCROLL ANIMATIONS (hero parallax + counters)
  ───────────────────────────────────────────── */
  function initGsap() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    /* hero parallax */
    var heroBg = $(".hero__bg-img");
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 18,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }

    /* hero text reveal */
    var heroItems = $$(".hero__reveal");
    if (heroItems.length) {
      gsap.fromTo(heroItems,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: .12, duration: .9, ease: "power3.out", delay: .3 }
      );
    }

    /* counter animation */
    $$("[data-count]").forEach(function (el) {
      var target = parseInt(el.dataset.count, 10);
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: function () {
          gsap.fromTo({ val: 0 }, { val: target, duration: 1.8, ease: "power2.out",
            onUpdate: function () { el.textContent = Math.round(this.targets()[0].val).toLocaleString(); }
          });
        }
      });
    });
  }

  /* ─────────────────────────────────────────────
     TABS
  ───────────────────────────────────────────── */
  function initTabs() {
    $$(".tabs-nav").forEach(function (nav) {
      var btns = $$(".tab-btn", nav);
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var target = btn.dataset.tab;
          var container = nav.closest(".tabs-wrap") || nav.parentElement;

          btns.forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");

          $$(".tab-panel", container).forEach(function (p) {
            p.classList.toggle("active", p.dataset.panel === target);
          });
        });
      });
    });
  }

  /* ─────────────────────────────────────────────
     TABLE SEARCH
  ───────────────────────────────────────────── */
  function initTableSearch() {
    $$(".search-input[data-table]").forEach(function (input) {
      var tableId = input.dataset.table;
      var table = document.getElementById(tableId);
      if (!table) return;
      input.addEventListener("input", function () {
        var q = input.value.toLowerCase().trim();
        $$("tbody tr", table).forEach(function (row) {
          row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    });
  }

  /* ─────────────────────────────────────────────
     CONTACT FORM — pre-fill from URL param
  ───────────────────────────────────────────── */
  function initContactPrefill() {
    var params = new URLSearchParams(window.location.search);
    var product = params.get("product");
    if (!product) return;
    var field = $("#product-interest");
    if (field) field.value = decodeURIComponent(product);
  }

  /* ─────────────────────────────────────────────
     CONTACT FORM — submission feedback
  ───────────────────────────────────────────── */
  function initContactForm() {
    var form = $("#quote-form");
    if (!form) return;

    // ── Formspree endpoint ──────────────────────────────────────
    var FORMSPREE_ID = "xpqerzen";
    // ────────────────────────────────────────────────────────────

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var btn = form.querySelector("button[type=submit]");
      var lang = localStorage.getItem("et_lang") || "es";

      // Estado: enviando
      if (btn) { btn.disabled = true; btn.textContent = lang === "en" ? "Sending…" : "Enviando…"; }

      var data = new FormData(form);

      fetch("https://formspree.io/f/" + FORMSPREE_ID, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      })
      .then(function (res) {
        if (res.ok) {
          // Éxito
          form.reset();
          if (btn) {
            btn.style.background = "#22c55e";
            btn.style.borderColor = "#22c55e";
            btn.textContent = lang === "en" ? "✓ Sent! We'll contact you soon." : "✓ ¡Enviado! Nos contactaremos pronto.";
          }
          setTimeout(function () {
            if (btn) {
              btn.disabled = false;
              btn.style.background = "";
              btn.style.borderColor = "";
              btn.textContent = lang === "en" ? "Send Request" : "Enviar Solicitud";
            }
          }, 5000);
        } else {
          throw new Error("server error");
        }
      })
      .catch(function () {
        // Error
        if (btn) {
          btn.disabled = false;
          btn.style.background = "#ef4444";
          btn.style.borderColor = "#ef4444";
          btn.textContent = lang === "en" ? "Error — try again or write us on WhatsApp" : "Error — intenta de nuevo o escríbenos por WhatsApp";
          setTimeout(function () {
            btn.style.background = "";
            btn.style.borderColor = "";
            btn.textContent = lang === "en" ? "Send Request" : "Enviar Solicitud";
          }, 5000);
        }
      });
    });
  }

  /* ─────────────────────────────────────────────
     SMOOTH SCROLL for anchors
  ───────────────────────────────────────────── */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 80,
        behavior: "smooth"
      });
    });
  }

  /* ─────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────── */
  function boot() {
    safe(initLang, "initLang");
    safe(initScrollBar, "initScrollBar");
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initTabs, "initTabs");
    safe(initTableSearch, "initTableSearch");
    safe(initContactPrefill, "initContactPrefill");
    safe(initContactForm, "initContactForm");
    safe(initSmoothScroll, "initSmoothScroll");

    if (window.gsap && window.ScrollTrigger) {
      safe(initGsap, "initGsap");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
