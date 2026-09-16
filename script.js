(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* ---------- Scroll state (shared by every effect) ---------- */
  const scroll = { y: window.scrollY, lastY: window.scrollY, vel: 0, dir: "down" };

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
      depth: Math.random() * 0.7 + 0.3,
      hue: Math.random() < 0.5 ? "34, 211, 238" : "139, 92, 246",
    }));
  }

  function drawNetwork() {
    ctx.clearRect(0, 0, w, h);
    const maxDist = 140 * dpr;
    const speed = Math.abs(scroll.vel);
    const warp = clamp(speed / 40); // 0..1 — how "hyperspace" we are
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy - scroll.vel * dpr * a.depth * 0.35; // scroll parallax, deeper nodes move less
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < -20) a.y += h + 40;
      else if (a.y > h + 20) a.y -= h + 40;

      const mdx = mouse.x * dpr - a.x;
      const mdy = mouse.y * dpr - a.y;
      if (Math.hypot(mdx, mdy) < 180 * dpr) {
        a.x += mdx * 0.002;
        a.y += mdy * 0.002;
      }

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxDist) {
          ctx.strokeStyle = `rgba(${a.hue}, ${(0.18 + warp * 0.25) * (1 - d / maxDist)})`;
          ctx.lineWidth = dpr * 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      if (warp > 0.05) {
        // warp streaks trail behind each node while scrolling fast
        ctx.strokeStyle = `rgba(${a.hue}, ${0.55 * warp})`;
        ctx.lineWidth = a.r * 0.9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x, a.y + scroll.vel * dpr * a.depth * 2.2);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${a.hue}, ${0.75 + warp * 0.25})`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r * (1 + warp * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  resize();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      measure();
      if (reduceMotion) drawNetwork();
    }, 150);
  });

  /* ---------- Cursor glow ---------- */
  const glow = $(".cursor-glow");
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
  const toggle = $(".nav-toggle");
  const links = $(".nav-links");

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
    nav.classList.remove("nav-hidden");
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    })
  );

  const sections = $$("main section[id]");
  const sectionLinks = [...links.querySelectorAll('a[href^="#"]')];

  /* ---------- Scroll HUD (side progress dots) ---------- */
  const hudLabels = { home: "home", about: "about", experience: "experience", projects: "projects", skills: "stack", education: "education", contact: "contact" };
  const hud = document.createElement("nav");
  hud.className = "scroll-hud";
  hud.setAttribute("aria-label", "Section progress");
  hud.innerHTML =
    `<div class="hud-count"><b>01</b> / ${String(sections.length).padStart(2, "0")}</div>` +
    sections.map((s) => `<a class="hud-dot" href="#${s.id}"><span>${hudLabels[s.id] || s.id}</span><i></i></a>`).join("");
  document.body.appendChild(hud);
  const hudDots = $$(".hud-dot", hud);
  const hudCount = $(".hud-count b", hud);

  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  document.body.appendChild(progressBar);

  function setActiveSection(id) {
    sectionLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + id));
    hudDots.forEach((d, i) => {
      const on = d.getAttribute("href") === "#" + id;
      d.classList.toggle("active", on);
      if (on) hudCount.textContent = String(i + 1).padStart(2, "0");
    });
  }
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && setActiveSection(en.target.id)),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Split headings into masked words ---------- */
  function splitWords(el) {
    const parts = [];
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          parts.push(/^\s+$/.test(t) ? document.createTextNode(" ") : wrapWord(document.createTextNode(t)));
        });
      } else {
        parts.push(wrapWord(node.cloneNode(true))); // keep gradient spans intact
      }
    });
    el.textContent = "";
    let i = 0;
    parts.forEach((p) => {
      if (p.classList) p.firstChild.style.setProperty("--wd", `${120 + i++ * 70}ms`);
      el.appendChild(p);
    });
  }
  function wrapWord(content) {
    const outer = document.createElement("span");
    const inner = document.createElement("span");
    outer.className = "w";
    inner.className = "w-inner";
    inner.appendChild(content);
    outer.appendChild(inner);
    return outer;
  }

  /* ---------- Decode / scramble text ---------- */
  const GLYPHS = "01<>/\\_-=+*#{}[]ABCDEFXYZ";
  function scramble(el) {
    if (reduceMotion) return;
    const finalText = el.dataset.text || (el.dataset.text = el.textContent);
    const start = performance.now();
    const dur = 900;
    cancelAnimationFrame(el._scr);
    (function frame(now) {
      const p = clamp((now - start) / dur);
      const settled = Math.floor(p * finalText.length);
      el.textContent = [...finalText]
        .map((ch, i) => (i < settled || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join("");
      if (p < 1) el._scr = requestAnimationFrame(frame);
      else el.textContent = finalText;
    })(start);
  }

  /* ---------- Counters (re-run every time they enter) ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    const start = performance.now();
    const dur = 1600;
    cancelAnimationFrame(el._cnt);
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) el._cnt = requestAnimationFrame(step);
    })(start);
  }

  /* ---------- Assign animation styles + stagger ---------- */
  const animMap = [
    [".project", "tilt"],
    [".tl-item", "side"],
    [".skill-card", "flip"],
    [".stat", "pop"],
    [".hero-visual", "zoom"],
  ];
  animMap.forEach(([sel, anim]) => $$(sel).forEach((el) => el.classList.contains("reveal") && (el.dataset.anim = anim)));

  const reveals = $$(".reveal");
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const idx = Math.min(siblings.indexOf(el), 6);
    el.style.setProperty("--d", `${idx * 90}ms`);
  });

  $$(".section-head h2, .contact-card h2").forEach(splitWords);
  $$(".section-head").forEach((head) => {
    const eb = $(".eyebrow", head);
    if (eb) head.dataset.num = eb.textContent.trim().slice(0, 2);
  });

  function enter(el) {
    el.classList.remove("from-top");
    el.classList.add("visible");
    const eb = $(".eyebrow", el);
    if (eb) scramble(eb);
    const num = $("[data-count]", el);
    if (num) animateCount(num);
  }
  function leave(el, above) {
    el.classList.toggle("from-top", above);
    el.classList.remove("visible");
    const num = $("[data-count]", el);
    if (num) { cancelAnimationFrame(num._cnt); num.textContent = "0" + (num.dataset.suffix || ""); }
  }

  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add("visible"));
    $$("[data-count]").forEach(animateCount);
  } else {
    const revealer = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          const el = en.target;
          const tall = en.boundingClientRect.height > window.innerHeight * 0.6;
          if (en.isIntersecting && (en.intersectionRatio >= 0.12 || tall)) enter(el);
          else if (!en.isIntersecting) leave(el, en.boundingClientRect.top < (en.rootBounds ? en.rootBounds.top : 0));
        }),
      { threshold: [0, 0.12], rootMargin: "-4% 0px -6% 0px" }
    );
    reveals.forEach((el) => revealer.observe(el));
  }

  /* ---------- Project filters ---------- */
  const filters = $$(".filter");
  const projects = $$(".project");
  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      projects.forEach((p) => {
        const show = f === "all" || p.dataset.cat === f;
        p.classList.toggle("hidden", !show);
        if (show) enter(p);
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

  /* ---------- Scroll-linked scenes ---------- */
  const hero = $(".hero");
  const heroText = $(".hero-text");
  const avatarWrap = $(".avatar-wrap");
  const chips = $$(".chip");
  const scrollHint = $(".scroll-hint");
  const glows = $$(".glow");
  const timeline = $(".timeline");
  const tlNodes = $$(".tl-node");
  const heads = $$(".section-head");
  const contactCard = $(".contact-card");

  const comet = document.createElement("div");
  comet.className = "tl-comet";
  timeline.appendChild(comet);

  let heroH = 0, tlTop = 0, tlH = 0, nodeOffsets = [];
  function measure() {
    heroH = hero.offsetHeight;
    const r = timeline.getBoundingClientRect();
    tlTop = r.top + window.scrollY;
    tlH = r.height;
    nodeOffsets = tlNodes.map((n) => n.getBoundingClientRect().top + window.scrollY - tlTop + 8);
  }
  measure();
  window.addEventListener("load", measure);

  const chipVectors = [[-160, -90, -25], [170, 40, 20], [-90, 150, -15]];

  function updateScene() {
    const y = scroll.y;
    const vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight - vh;

    progressBar.style.transform = `scaleX(${docH > 0 ? y / docH : 0})`;

    // nav: hide going down, reveal going up
    if (!links.classList.contains("open")) {
      nav.classList.toggle("nav-hidden", scroll.dir === "down" && y > 500);
    }
    nav.classList.toggle("scrolled", y > 20);
    hud.classList.toggle("on", y > vh * 0.5);

    // hero exit / re-assembly
    const hp = clamp(y / (heroH * 0.85));
    if (hp < 1 || heroText.style.opacity !== "0") {
      heroText.style.translate = `0 ${-hp * 160}px`;
      heroText.style.opacity = String(clamp(1 - hp * 1.25));
      heroText.style.filter = hp > 0.01 ? `blur(${hp * 8}px)` : "";
      avatarWrap.style.scale = String(1 - hp * 0.35);
      avatarWrap.style.rotate = `${-hp * 30}deg`;
      avatarWrap.style.translate = `0 ${hp * 90}px`;
      avatarWrap.style.opacity = String(clamp(1 - hp * 1.1));
      chips.forEach((c, i) => {
        const [dx, dy, rot] = chipVectors[i] || [0, 0, 0];
        c.style.translate = `${dx * hp * 1.4}px ${dy * hp * 1.4}px`;
        c.style.rotate = `${rot * hp}deg`;
      });
      if (scrollHint) scrollHint.style.opacity = String(clamp(1 - hp * 4));
    }

    // glow orbs drift at different speeds
    glows.forEach((g, i) => (g.style.translate = `0 ${y * (i ? -0.12 : 0.18)}px`));

    // timeline draws itself; nodes light up as the comet passes
    const start = tlTop - vh * 0.65;
    const tp = clamp((y - start) / tlH);
    timeline.style.setProperty("--tl", tp.toFixed(4));
    timeline.style.setProperty("--tl-on", tp > 0 && tp < 1 ? "1" : "0");
    tlNodes.forEach((n, i) => n.classList.toggle("lit", tp * tlH >= nodeOffsets[i]));

    // giant section numbers slide horizontally
    heads.forEach((head) => {
      const r = head.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const rel = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5 around center
      head.style.setProperty("--px", (rel * 220).toFixed(1));
    });

    // contact card zooms in toward center
    const cr = contactCard.getBoundingClientRect();
    const cp = clamp(1 - (cr.top - vh * 0.15) / (vh * 0.85));
    contactCard.style.scale = String(0.86 + cp * 0.14);
  }

  /* ---------- Main loop ---------- */
  let needsScene = true;
  window.addEventListener("scroll", () => (needsScene = true), { passive: true });

  function loop() {
    const y = window.scrollY;
    const raw = y - scroll.lastY;
    scroll.lastY = y;
    scroll.y = y;
    scroll.vel += (raw - scroll.vel) * 0.18;
    if (Math.abs(scroll.vel) < 0.01) scroll.vel = 0;
    if (Math.abs(raw) > 2) scroll.dir = raw > 0 ? "down" : "up";

    if (needsScene || raw !== 0) {
      updateScene();
      needsScene = false;
    }
    drawNetwork();
    requestAnimationFrame(loop);
  }

  if (reduceMotion) {
    drawNetwork();
    const staticScene = () => {
      scroll.y = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      nav.classList.toggle("scrolled", scroll.y > 20);
      hud.classList.toggle("on", scroll.y > window.innerHeight * 0.5);
      timeline.style.setProperty("--tl", "1");
      tlNodes.forEach((n) => n.classList.add("lit"));
      progressBar.style.transform = `scaleX(${docH > 0 ? scroll.y / docH : 0})`;
    };
    window.addEventListener("scroll", staticScene, { passive: true });
    staticScene();
  } else {
    requestAnimationFrame(loop);
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
