(function () {
  const root = document.documentElement;
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const navIndicator = document.querySelector(".nav-indicator");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const year = document.querySelector("[data-year]");
  const menuLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = menuLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  let programmaticTarget = null;
  let programmaticTimer = 0;

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");

  navToggle?.addEventListener("click", () => {
    const isOpen = navLinks?.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", Boolean(isOpen));
    navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetHash = link.getAttribute("href");
      const target = targetHash ? document.querySelector(targetHash) : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      navLinks?.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      navToggle?.setAttribute("aria-expanded", "false");
      scrollToSection(targetHash, target);
    });
  });

  themeToggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
  });

  const setActiveHash = (hash) => {
    let activeLink = null;

    menuLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === hash;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        activeLink = link;
      }
    });

    updateNavIndicator(activeLink);
  };

  const updateNavIndicator = (activeLink) => {
    if (!navIndicator || !navLinks || !activeLink) {
      return;
    }

    const navRect = navLinks.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    if (!navRect.width || !linkRect.width) {
      return;
    }

    navIndicator.style.setProperty("--nav-indicator-x", `${linkRect.left - navRect.left}px`);
    navIndicator.style.setProperty("--nav-indicator-width", `${linkRect.width}px`);
    navIndicator.style.opacity = "1";
  };

  const getHeaderOffset = () => {
    const header = document.querySelector(".site-header");
    return (header?.offsetHeight || 68) + 18;
  };

  const getSectionTop = (section) => {
    const rawTop = section.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    const maxTop = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(rawTop, maxTop));
  };

  const clearProgrammaticScroll = () => {
    programmaticTarget = null;
    window.clearTimeout(programmaticTimer);
  };

  const scrollToSection = (hash, section) => {
    const top = getSectionTop(section);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    programmaticTarget = { hash, top };
    setActiveHash(hash);
    window.clearTimeout(programmaticTimer);
    window.history.replaceState(null, "", hash);
    window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });

    programmaticTimer = window.setTimeout(() => {
      clearProgrammaticScroll();
      setActiveLink();
    }, prefersReducedMotion ? 0 : 1200);
  };

  const setActiveLink = () => {
    const headerOffset = getHeaderOffset() + 32;
    const scrollPosition = window.scrollY + headerOffset;
    const isAtPageEnd =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let active = sections[0];

    if (programmaticTarget) {
      const lastHash = `#${sections[sections.length - 1]?.id}`;
      const reachedTarget =
        Math.abs(window.scrollY - programmaticTarget.top) <= 2 ||
        (programmaticTarget.hash === lastHash && isAtPageEnd);

      setActiveHash(programmaticTarget.hash);

      if (reachedTarget) {
        clearProgrammaticScroll();
      }

      return;
    }

    if (isAtPageEnd) {
      active = sections[sections.length - 1];
    } else {
      sections.forEach((section) => {
        if (section.offsetTop <= scrollPosition) {
          active = section;
        }
      });
    }

    setActiveHash(`#${active?.id}`);
  };

  setActiveLink();
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) {
        return;
      }

      window.requestAnimationFrame(() => {
        setActiveLink();
        ticking = false;
      });
      ticking = true;
    },
    { passive: true },
  );
  window.addEventListener("resize", setActiveLink);
})();
