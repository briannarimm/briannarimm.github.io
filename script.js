document.documentElement.classList.add("js");
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 90}ms`;
  io.observe(el);
});

// Hero logo -> navbar brand scroll transition
const heroLogo = document.querySelector(".hero-logo");
const navBrand = document.querySelector(".site-header .brand");
if (heroLogo && navBrand) {
  document.documentElement.classList.add("has-hero-logo");
  let heroDocTop = 0, heroLeft = 0, brandTop = 0, brandLeft = 0, scaleRatio = 1, travel = 1;

  const docOffset = (el) => {
    let top = 0, left = 0, n = el;
    while (n) {
      top += n.offsetTop;
      left += n.offsetLeft;
      n = n.offsetParent;
    }
    return { top, left };
  };

  const measureLogo = () => {
    const hPos = docOffset(heroLogo);
    heroDocTop = hPos.top;
    heroLeft = hPos.left;
    brandTop = navBrand.offsetTop;
    brandLeft = navBrand.offsetLeft;
    const hSize = parseFloat(getComputedStyle(heroLogo).fontSize) || 64;
    const bSize = parseFloat(getComputedStyle(navBrand).fontSize) || 22.4;
    scaleRatio = hSize / bSize;
    travel = Math.max(1, heroDocTop - brandTop);
  };

  const syncLogo = () => {
    const y = window.scrollY;
    const p = Math.min(Math.max(y / travel, 0), 1);
    if (reduced) {
      const docked = p >= 1;
      heroLogo.classList.toggle("is-floating", docked);
      navBrand.classList.toggle("is-docked", docked);
      navBrand.classList.remove("is-active");
      navBrand.style.transform = "";
      return;
    }
    if (p <= 0) {
      heroLogo.classList.remove("is-floating");
      navBrand.classList.remove("is-active", "is-docked");
      navBrand.style.transform = "";
    } else if (p < 1) {
      const inv = 1 - p;
      const dx = (heroLeft - brandLeft) * inv;
      const dy = (heroDocTop - y) - brandTop;
      const s = 1 + (scaleRatio - 1) * inv;
      heroLogo.classList.add("is-floating");
      navBrand.classList.add("is-active");
      navBrand.classList.remove("is-docked");
      navBrand.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
    } else {
      heroLogo.classList.add("is-floating");
      navBrand.classList.remove("is-active");
      navBrand.classList.add("is-docked");
      navBrand.style.transform = "";
    }
  };

  measureLogo();
  syncLogo();
  window.addEventListener("scroll", syncLogo, { passive: true });
  window.addEventListener("resize", () => {
    measureLogo();
    syncLogo();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measureLogo();
      syncLogo();
    });
  }
}

// Papers & Projects: filter buttons, search, and empty state
document.querySelectorAll("[data-collection]").forEach((grid) => {
  const scope = grid.closest("main") || document;
  const buttons = [...scope.querySelectorAll(".filter")];
  const search = scope.querySelector("[data-search-input]");
  const empty = grid.parentElement.querySelector(".empty");
  const cards = [...grid.querySelectorAll(".card")];
  let filter = "all";

  const apply = () => {
    const q = search ? search.value.trim().toLowerCase() : "";
    let shown = 0;
    cards.forEach((card) => {
      const okCat = filter === "all" || card.dataset.category === filter;
      const okText = !q || (card.dataset.search || "").includes(q);
      card.hidden = !(okCat && okText);
      if (!card.hidden) {
        card.classList.add("in");
        shown++;
      }
    });
    if (empty) empty.hidden = shown > 0;
  };

  buttons.forEach((b) => b.addEventListener("click", () => {
    filter = b.dataset.filter;
    buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  }));
  if (search) search.addEventListener("input", apply);

  // A link such as /items/#paper opens the page with that filter on.
  const fromHash = location.hash.slice(1);
  const start = buttons.find((b) => b.dataset.filter === fromHash);
  if (start) start.click();
});

// Item page carousel
document.querySelectorAll("[data-carousel]").forEach((car) => {
  const track = car.querySelector(".carousel-track");
  const slides = [...track.children];
  const dots = car.querySelector(".dots");
  if (slides.length < 2 || !dots) return;

  const current = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = (i) => {
    const n = (i + slides.length) % slides.length;
    track.scrollTo({ left: n * track.clientWidth, behavior: reduced ? "auto" : "smooth" });
  };

  const dotEls = slides.map((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", `Show image ${i + 1}`);
    d.addEventListener("click", () => go(i));
    dots.appendChild(d);
    return d;
  });
  dots.removeAttribute("aria-hidden");
  const mark = () => dotEls.forEach((d, i) => d.setAttribute("aria-current", String(i === current())));
  mark();

  car.querySelector(".prev").addEventListener("click", () => go(current() - 1));
  car.querySelector(".next").addEventListener("click", () => go(current() + 1));
  track.addEventListener("scroll", () => requestAnimationFrame(mark), { passive: true });
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
  });
});

// Citation: add today's date as the access date
document.querySelectorAll("[data-accessed]").forEach((el) => {
  const d = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  el.textContent = `, accessed ${d}`;
});

if (!reduced) {
  // Cursor spotlight
  window.addEventListener("pointermove", (e) => {
    document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
    document.documentElement.style.setProperty("--my", `${e.clientY}px`);
  });

  // Gentle portrait parallax
  const frame = document.querySelector(".frame");
  if (frame) {
    window.addEventListener("pointermove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      frame.style.setProperty("--px", `${x}px`);
      frame.style.setProperty("--py", `${y}px`);
    });
  }

  // Card tilt
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", `${x * 6}deg`);
      card.style.setProperty("--rx", `${-y * 6}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  // Rotating words in the hero
  const words = ["legal research", "reference services", "instructional design", "legal informatics"];
  const el = document.querySelector(".rotator-word");
  if (el) {
    let i = 0;
    setInterval(() => {
      el.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove("out");
      }, 350);
    }, 2600);
  }
}
