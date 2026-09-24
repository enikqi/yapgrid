/* ==========================================================================
   LUMINA — main.js
   Vanilla ES2015+. No framework. Every block is independent: if one vendor
   script fails to load the rest of the page still works.
   ========================================================================== */

(function () {
  "use strict";

  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* Storage can throw in private mode or with site data blocked. */
  var store = {
    get: function (k) {
      try {
        return window.localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        window.localStorage.setItem(k, v);
      } catch (e) {
        /* non-fatal */
      }
    },
  };

  /* ========================================================================
     Theme — applied early in <head> to avoid a flash, toggled here
     ======================================================================== */

  function initTheme() {
    var btns = $$("[data-theme-toggle]");
    if (!btns.length) return;

    function apply(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      store.set("lumina-theme", theme);
      btns.forEach(function (b) {
        b.setAttribute(
          "aria-label",
          theme === "light" ? "Switch to dark theme" : "Switch to light theme"
        );
      });
    }

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var current =
          document.documentElement.getAttribute("data-theme") || "dark";
        apply(current === "light" ? "dark" : "light");
      });
    });
  }

  /* ========================================================================
     Preloader
     ======================================================================== */

  function initPreloader() {
    var el = $(".lu-preloader");
    if (!el) return;

    var bar = $(".lu-preloader__bar span", el);
    var pct = 0;

    var tick = setInterval(function () {
      pct = Math.min(100, pct + Math.random() * 18);
      if (bar) bar.style.width = pct + "%";
      if (pct >= 100) clearInterval(tick);
    }, 90);

    function finish() {
      clearInterval(tick);
      if (bar) bar.style.width = "100%";
      setTimeout(function () {
        el.classList.add("is-done");
        document.body.classList.add("is-loaded");
      }, 260);
    }

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish);

    /* Never trap the page behind a stuck preloader. */
    setTimeout(finish, 4000);
  }

  /* ========================================================================
     Smooth scroll (Lenis) — optional dependency
     ======================================================================== */

  function initSmoothScroll() {
    if (reduceMotion || typeof window.Lenis !== "function") return;

    var lenis = new window.Lenis({
      duration: 1.05,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    window.__lenis = lenis;

    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      a.addEventListener("click", function (e) {
        var target = document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
  }

  /* ========================================================================
     Navbar — sticky, auto-hide, drawer, dropdowns
     ======================================================================== */

  function initNav() {
    var nav = $(".lu-nav");
    if (!nav) return;

    var burger = $(".lu-burger");
    var drawer = $(".lu-drawer");
    var lastY = window.pageYOffset;

    function onScroll() {
      var y = window.pageYOffset;
      nav.classList.toggle("is-stuck", y > 20);

      var drawerOpen = drawer && drawer.classList.contains("is-open");
      if (!drawerOpen && y > 400) {
        nav.classList.toggle("is-hidden", y > lastY);
      } else {
        nav.classList.remove("is-hidden");
      }
      lastY = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger && drawer) {
      burger.addEventListener("click", function () {
        var open = drawer.classList.toggle("is-open");
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
        if (window.__lenis) {
          open ? window.__lenis.stop() : window.__lenis.start();
        }
      });

      $$(".lu-drawer__list a").forEach(function (a) {
        a.addEventListener("click", function () {
          if (a.getAttribute("href") === "#") return;
          drawer.classList.remove("is-open");
          burger.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
          if (window.__lenis) window.__lenis.start();
        });
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && drawer.classList.contains("is-open")) {
          burger.click();
        }
      });
    }

    $$(".lu-drawer__toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sub = btn.parentElement.nextElementSibling;
        if (!sub) return;
        var open = sub.classList.toggle("is-open");
        btn.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* ========================================================================
     Scroll progress bar
     ======================================================================== */

  function initProgress() {
    var bar = $(".lu-progress");
    if (!bar) return;

    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? window.pageYOffset / h : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ========================================================================
     Custom cursor — pointer devices only
     ======================================================================== */

  function initCursor() {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    var ring = $(".lu-cursor");
    var dot = $(".lu-cursor-dot");
    if (!ring || !dot) return;

    var mx = 0,
      my = 0,
      rx = 0,
      ry = 0;

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px)";
      ring.style.opacity = "1";
      dot.style.opacity = "1";
    });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(loop);
    })();

    document.addEventListener("mouseleave", function () {
      ring.style.opacity = "0";
      dot.style.opacity = "0";
    });

    var hot = "a, button, .lu-work, .lu-card, [data-cursor]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hot)) ring.classList.add("is-active");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hot)) ring.classList.remove("is-active");
    });
  }

  /* ========================================================================
     Reveal on scroll
     ======================================================================== */

  function initReveal() {
    var items = $$("[data-reveal], .lu-lines");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    /* Wrap each line of a .lu-lines heading so it can slide up from a mask. */
    $$(".lu-lines").forEach(function (el) {
      if (el.dataset.wrapped === "1") return;
      var parts = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = parts
        .map(function (p, i) {
          return (
            '<span><i style="--d:' + i * 90 + 'ms">' + p.trim() + "</i></span>"
          );
        })
        .join("");
      el.dataset.wrapped = "1";
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ========================================================================
     Counters
     ======================================================================== */

  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.dataset.count);
      if (isNaN(target)) return;
      if (reduceMotion) {
        el.textContent = String(target);
        return;
      }

      var dur = 1600;
      var start = null;
      var dec = (el.dataset.count.split(".")[1] || "").length;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    nums.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ========================================================================
     Hero word rotator
     ======================================================================== */

  function initRotator() {
    var box = $(".lu-rotator");
    if (!box) return;

    var words = $$("span", box);
    if (words.length < 2) return;

    var i = 0;
    words[0].classList.add("is-in");

    if (reduceMotion) return;

    setInterval(function () {
      words[i].classList.remove("is-in");
      words[i].classList.add("is-out");
      var prev = i;
      i = (i + 1) % words.length;
      words[i].classList.remove("is-out");
      words[i].classList.add("is-in");
      setTimeout(function () {
        words[prev].classList.remove("is-out");
      }, 520);
    }, 2600);
  }

  /* ========================================================================
     Portfolio filter
     ======================================================================== */

  function initFilters() {
    var bar = $("[data-filter-bar]");
    if (!bar) return;

    var buttons = $$(".lu-filter", bar);
    var items = $$("[data-cat]");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.dataset.filter;

        buttons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });

        items.forEach(function (item) {
          var match = key === "all" || item.dataset.cat === key;
          if (match) {
            item.classList.remove("is-hidden");
            requestAnimationFrame(function () {
              item.classList.remove("is-fading");
            });
          } else {
            item.classList.add("is-fading");
            setTimeout(function () {
              if (item.classList.contains("is-fading")) {
                item.classList.add("is-hidden");
              }
            }, 260);
          }
        });
      });
    });
  }

  /* ========================================================================
     Accordion (FAQ) — grid-rows transition, keyboard accessible
     ======================================================================== */

  function initAccordion() {
    $$(".lu-acc").forEach(function (acc) {
      var single = acc.dataset.single !== "false";
      var buttons = $$(".lu-acc__btn", acc);

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var panel = document.getElementById(
            btn.getAttribute("aria-controls")
          );
          var open = btn.getAttribute("aria-expanded") === "true";

          if (single) {
            buttons.forEach(function (other) {
              if (other === btn) return;
              other.setAttribute("aria-expanded", "false");
              var op = document.getElementById(
                other.getAttribute("aria-controls")
              );
              if (op) op.classList.remove("is-open");
            });
          }

          btn.setAttribute("aria-expanded", open ? "false" : "true");
          if (panel) panel.classList.toggle("is-open", !open);
        });
      });
    });
  }

  /* ========================================================================
     Pricing billing switch
     ======================================================================== */

  function initPricing() {
    var sw = $("[data-billing]");
    if (!sw) return;

    var buttons = $$("button", sw);
    var amounts = $$("[data-monthly]");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.dataset.mode;
        buttons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        amounts.forEach(function (el) {
          el.textContent =
            mode === "yearly" ? el.dataset.yearly : el.dataset.monthly;
        });
        $$("[data-per]").forEach(function (el) {
          el.textContent = mode === "yearly" ? "/year" : "/month";
        });
      });
    });
  }

  /* ========================================================================
     Forms — client-side validation only; wire to your own backend
     ======================================================================== */

  function initForms() {
    $$("[data-validate]").forEach(function (form) {
      var note = $(".lu-form-note", form);

      form.setAttribute("novalidate", "novalidate");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;

        $$("[required]", form).forEach(function (field) {
          var msg = field.parentElement.querySelector(".lu-error");
          var value = (field.value || "").trim();
          var error = "";

          if (!value) {
            error = "This field is required.";
          } else if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
            error = "Enter a valid email address.";
          } else if (field.tagName === "TEXTAREA" && value.length < 10) {
            error = "Please write at least 10 characters.";
          }

          field.classList.toggle("is-invalid", !!error);
          if (msg) msg.textContent = error;
          if (error) ok = false;
        });

        if (!note) return;

        if (ok) {
          note.className = "lu-form-note is-ok";
          note.textContent =
            "Thanks — your message is ready to send. Connect this form to your backend or an email service to deliver it.";
          form.reset();
        } else {
          note.className = "lu-form-note is-err";
          note.textContent = "Please fix the highlighted fields and try again.";
        }
      });

      $$("input, textarea", form).forEach(function (field) {
        field.addEventListener("input", function () {
          field.classList.remove("is-invalid");
          var msg = field.parentElement.querySelector(".lu-error");
          if (msg) msg.textContent = "";
        });
      });
    });
  }

  /* ========================================================================
     Testimonial slider (Swiper) — optional dependency
     ======================================================================== */

  function initSliders() {
    if (typeof window.Swiper !== "function") return;

    $$("[data-swiper]").forEach(function (el) {
      var perView = parseInt(el.dataset.perView || "3", 10);

      new window.Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 20,
        grabCursor: true,
        speed: 650,
        autoplay: reduceMotion
          ? false
          : { delay: 5200, disableOnInteraction: false },
        navigation: {
          nextEl: el.parentElement.querySelector("[data-next]"),
          prevEl: el.parentElement.querySelector("[data-prev]"),
        },
        breakpoints: {
          640: { slidesPerView: Math.min(2, perView), spaceBetween: 24 },
          992: { slidesPerView: perView, spaceBetween: 28 },
        },
      });
    });
  }

  /* ========================================================================
     Back to top
     ======================================================================== */

  function initToTop() {
    var btn = $(".lu-to-top");
    if (!btn) return;

    window.addEventListener(
      "scroll",
      function () {
        btn.classList.toggle("is-shown", window.pageYOffset > 600);
      },
      { passive: true }
    );

    btn.addEventListener("click", function () {
      if (window.__lenis) window.__lenis.scrollTo(0);
      else
        window.scrollTo({
          top: 0,
          behavior: reduceMotion ? "auto" : "smooth",
        });
    });
  }

  /* ========================================================================
     Countdown (Coming Soon)
     ======================================================================== */

  function initCountdown() {
    var box = $("[data-countdown]");
    if (!box) return;

    var target = new Date(box.dataset.countdown).getTime();
    if (isNaN(target)) return;

    var cells = {
      days: $("[data-cd-days]", box),
      hours: $("[data-cd-hours]", box),
      minutes: $("[data-cd-minutes]", box),
      seconds: $("[data-cd-seconds]", box),
    };

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function tick() {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;

      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400);
      var h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);

      if (cells.days) cells.days.textContent = pad(d);
      if (cells.hours) cells.hours.textContent = pad(h);
      if (cells.minutes) cells.minutes.textContent = pad(m);
      if (cells.seconds) cells.seconds.textContent = pad(s % 60);
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ========================================================================
     Current year in the footer
     ======================================================================== */

  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ========================================================================
     Boot
     ======================================================================== */

  function boot() {
    initTheme();
    initPreloader();
    initSmoothScroll();
    initNav();
    initProgress();
    initCursor();
    initReveal();
    initCounters();
    initRotator();
    initFilters();
    initAccordion();
    initPricing();
    initForms();
    initSliders();
    initToTop();
    initCountdown();
    initYear();

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
