/* ==========================================================================
   Rockview ICT Portal — shared interactions (loaded on both pages)

   1. Mobile navigation   opens and closes the menu on small screens
   2. Back to top         floating button + footer link
   3. Scroll reveal       fades sections in as they come into view
   4. Footer year         keeps the copyright year current

   The code is wrapped in a function that runs immediately so its variables
   stay private and cannot clash with js/validation.js.
   ========================================================================== */
(() => {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Mobile navigation
     ------------------------------------------------------------------------ */
  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("nav-toggle");
  const siteNav = document.getElementById("site-nav");

  function setMenu(open) {
    siteNav.classList.toggle("is-open", open);
    // aria-expanded tells screen readers whether the menu is open
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  function menuIsOpen() {
    return navToggle.getAttribute("aria-expanded") === "true";
  }

  if (header && navToggle && siteNav) {
    navToggle.addEventListener("click", () => setMenu(!menuIsOpen()));

    // Close after choosing a link (important for same-page links like #about)
    siteNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    // Close with the Escape key and return focus to the button
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuIsOpen()) {
        setMenu(false);
        navToggle.focus();
      }
    });

    // Close when clicking anywhere outside the header
    document.addEventListener("click", (event) => {
      if (menuIsOpen() && !header.contains(event.target)) setMenu(false);
    });

    // Close if the window is resized to the desktop layout
    window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------------
     2. Back to top
     The CSS rule "scroll-behavior: smooth" makes the scroll animated, and
     switches it off for visitors who prefer reduced motion.
     ------------------------------------------------------------------------ */
  const toTopButton = document.getElementById("to-top");

  function scrollToTop() {
    window.scrollTo({ top: 0 });
  }

  if (toTopButton) {
    const updateButton = () => {
      toTopButton.classList.toggle("is-visible", window.scrollY > 600);
    };
    updateButton();
    window.addEventListener("scroll", updateButton, { passive: true });
    toTopButton.addEventListener("click", scrollToTop);
  }

  document.querySelectorAll('a[href="#top"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToTop();
    });
  });

  /* ------------------------------------------------------------------------
     3. Scroll reveal
     Elements marked with data-reveal start hidden (see "Motion" in the
     stylesheet) and receive the class "is-visible" when scrolled into view.
     ------------------------------------------------------------------------ */
  const revealTargets = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // animate once only
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach((target) => observer.observe(target));
  } else {
    // Older browsers: show everything straight away
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------------
     4. Footer year
     ------------------------------------------------------------------------ */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
