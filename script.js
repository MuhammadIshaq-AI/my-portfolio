(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Neural network background ---------- */
  const canvas = document.getElementById("neural-bg");
  const ctx = canvas.getContext("2d");
  let nodes = [];
  let w, h, dpr;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const count = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * dpr,
      vy: (Math.random() - 0.5) * 0.25 * dpr,
      r: (Math.random() * 1.6 + 0.6) * dpr,
      hue: Math.random() < 0.5 ? "34, 211, 238" : "139, 92, 246",
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const maxDist = 140 * dpr;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;

      // gentle attraction to the cursor
      const mdx = mouse.x * dpr - a.x;
      const mdy = mouse.y * dpr - a.y;
      const md = Math.hypot(mdx, mdy);
      if (md < 180 * dpr) {
        a.x += mdx * 0.002;
        a.y += mdy * 0.002;
      }

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxDist) {
          ctx.strokeStyle = `rgba(${a.hue}, ${0.18 * (1 - d / maxDist)})`;
          ctx.lineWidth = dpr * 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${a.hue}, 0.75)`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  draw();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduceMotion) draw(); }, 150);
  });

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector(".cursor-glow");
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });

  /* ---------- Typing effect ---------- */
  const roles = [
    "AI Engineer",
    "Co-Founder @ AI Cortexo",
    "Multi-Agent Systems & AI Workflows",
    "Generative AI & RAG Systems",
    "Knowledge Graphs · NLP",
    "Computer Vision · YOLO26 · ViT",
    "AWS Bedrock · SageMaker · Glue",
  ];
  const typed = document.getElementById("typed");
  if (reduceMotion) {
    typed.textContent = roles[0];
  } else {
    let r = 0, c = 0, deleting = false;
    (function tick() {
      const word = roles[r];
      typed.textContent = word.slice(0, c);
      if (!deleting && c < word.length) { c++; setTimeout(tick, 65); }
      else if (!deleting) { deleting = true; setTimeout(tick, 1600); }
      else if (c > 0) { c--; setTimeout(tick, 30); }
      else { deleting = false; r = (r + 1) % roles.length; setTimeout(tick, 300); }
    })();
  }

  /* ---------- Nav ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    })
  );

  // highlight active section link
  const sectionLinks = [...links.querySelectorAll('a[href^="#"]')];
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      sectionLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

  /* ---------- Reveal + counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const start = performance.now();
    const dur = 1600;
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  const revealer = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("visible");
      const num = en.target.querySelector("[data-count]");
      if (num) animateCount(num);
      revealer.unobserve(en.target);
    }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    revealer.observe(el);
  });

  /* ---------- Project filters ---------- */
  const filters = document.querySelectorAll(".filter");
  const projects = document.querySelectorAll(".project");
  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      projects.forEach((p) => {
        const show = f === "all" || p.dataset.cat === f;
        p.classList.toggle("hidden", !show);
        if (show) p.classList.add("visible");
      });
    })
  );

  /* ---------- Card spotlight ---------- */
  projects.forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    })
  );

  document.getElementById("year").textContent = new Date().getFullYear();
})();
