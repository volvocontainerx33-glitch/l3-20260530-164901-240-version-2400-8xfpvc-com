
(function () {
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function getQuery() {
    const params = new URLSearchParams(location.search);
    return (params.get("q") || "").trim();
  }

  async function loadMovies() {
    const res = await fetch("./assets/movies.json", { cache: "no-store" });
    if (!res.ok) throw new Error("movies.json load failed");
    return await res.json();
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function movieCard(m) {
    const tags = [...new Set([...(m.genres || []), ...(m.tags || [])])].slice(0, 4);
    const tagHtml = tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
    return `
      <article class="movie-card">
        <a class="movie-cover" href="./${m.slug}.html">
          <img src="./${m.cover}" alt="${escapeHtml(m.title)}" loading="lazy">
          <span class="cover-year">${m.year}</span>
          <span class="cover-badge">${escapeHtml(m.primary_theme || "")}</span>
        </a>
        <div class="movie-body">
          <div class="movie-head">
            <h3><a href="./${m.slug}.html">${escapeHtml(m.title)}</a></h3>
            <div class="movie-meta">
              <span>${escapeHtml(m.region || "")}</span>
              <span>${escapeHtml(m.type || "")}</span>
              <span>${Number(m.rating || 0).toFixed(1)}★</span>
            </div>
          </div>
          <p class="movie-desc">${escapeHtml(m.one_line || m.summary || "")}</p>
          <div class="movie-tags">${tagHtml}</div>
        </div>
      </article>
    `;
  }

  function initLocalFilter() {
    const input = document.querySelector("[data-filter-input]");
    const target = document.querySelector("[data-filter-target]");
    if (!input || !target) return;
    const cards = $$(".movie-card", target);
    const onInput = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach((card) => {
        const txt = (card.dataset.title + " " + card.dataset.tags).toLowerCase();
        const ok = !q || txt.includes(q);
        card.classList.toggle("hidden", !ok);
        if (ok) shown++;
      });
      const badge = document.querySelector("[data-filter-count]");
      if (badge) badge.textContent = `${shown} 部可见`;
    };
    input.addEventListener("input", onInput);
    onInput();
  }

  async function initSearchPage() {
    const page = document.querySelector("[data-search-page]");
    if (!page) return;
    const input = document.querySelector("[data-search-input]");
    const results = document.querySelector("[data-search-results]");
    const stats = document.querySelector("[data-search-stats]");
    if (!input || !results || !stats) return;
    const q = getQuery();
    input.value = q;
    const movies = await loadMovies();
    const run = () => {
      const text = input.value.trim().toLowerCase();
      const tokens = text.split(/\s+/).filter(Boolean);
      const matched = movies.filter((m) => {
        if (!tokens.length) return true;
        const hay = [
          m.title,
          m.region,
          m.type,
          String(m.year),
          ...(m.genres || []),
          ...(m.tags || []),
          m.one_line || "",
          m.summary || "",
        ].join(" ").toLowerCase();
        return tokens.every((t) => hay.includes(t.toLowerCase()));
      }).sort((a, b) => (b.recommend - a.recommend) || (b.views - a.views) || (b.year - a.year));
      stats.textContent = `共找到 ${matched.length} 部影片`;
      results.innerHTML = matched.slice(0, 120).map(movieCard).join("") || `<div class="empty-state">没有找到匹配的影片。</div>`;
    };
    input.addEventListener("input", run);
    run();
  }

  async function initHlsPlayers() {
    const vids = $$("video[data-hls]");
    if (!vids.length) return;
    if (!window.Hls) {
      // Hls.js is loaded as a deferred external script on detail pages, but keep a fallback.
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      document.head.appendChild(script);
      await new Promise((resolve) => { script.onload = resolve; script.onerror = resolve; });
    }
    vids.forEach((video) => {
      const src = video.getAttribute("src") || "";
      const canNative = video.canPlayType("application/vnd.apple.mpegurl");
      if (canNative) return;
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      }
    });
  }

  function initHeaderActive() {
    const path = location.pathname.split("/").pop() || "index.html";
    $$(".nav a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href === "./" + path || href === path || (path === "" && href.includes("index.html"))) {
        a.classList.add("active");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeaderActive();
    initLocalFilter();
    initSearchPage();
    initHlsPlayers();

    const heroSearch = document.querySelector("[data-hero-search]");
    if (heroSearch) {
      heroSearch.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = heroSearch.querySelector("input")?.value.trim();
        if (q) location.href = "./search.html?q=" + encodeURIComponent(q);
      });
    }
  });
})();
