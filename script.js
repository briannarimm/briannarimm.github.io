document.documentElement.classList.add("js");
document.getElementById("year").textContent = new Date().getFullYear();

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
      card.style.setProperty("--ry", `${x * 8}deg`);
      card.style.setProperty("--rx", `${-y * 8}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  // Rotating words in the hero
  const words = ["legal research", "law libraries", "access to justice", "legal technology"];
  const el = document.querySelector(".rotator-word");
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
