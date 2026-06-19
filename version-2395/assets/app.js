(function () {
  const hlsSource = "https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js";
  let hlsPromise = null;

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsPromise) {
      return hlsPromise;
    }

    hlsPromise = new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = hlsSource;
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = function () {
        reject(new Error("hls-load-failed"));
      };
      document.head.appendChild(script);
    });

    return hlsPromise;
  }

  function setupMobileNav() {
    const button = document.querySelector("[data-mobile-toggle]");
    const nav = document.querySelector("[data-mobile-nav]");

    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      button.classList.toggle("is-open");
    });
  }

  function setupHeroCarousel() {
    const root = document.querySelector("[data-hero-carousel]");

    if (!root) {
      return;
    }

    const slides = Array.from(root.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(root.querySelectorAll("[data-hero-dot]"));

    if (slides.length < 2) {
      return;
    }

    let index = 0;
    let timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = null;
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupSearchForms() {
    const forms = Array.from(document.querySelectorAll(".site-search-form"));

    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        const input = form.querySelector("input[name='q']");
        const query = input ? input.value.trim() : "";

        if (!query) {
          event.preventDefault();
          window.location.href = "./search.html";
        }
      });
    });
  }

  function setupFilters() {
    const input = document.querySelector("[data-filter-input]");
    const sortSelect = document.querySelector("[data-sort-select]");
    const grid = document.querySelector("[data-card-grid]");

    if (!grid) {
      return;
    }

    const cards = Array.from(grid.querySelectorAll(".filter-card"));
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || "";

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function applyFilter() {
      const query = normalize(input ? input.value : "");

      cards.forEach(function (card) {
        const source = normalize(card.getAttribute("data-search"));
        card.classList.toggle("is-hidden", query && !source.includes(query));
      });
    }

    function applySort() {
      if (!sortSelect) {
        return;
      }

      const value = sortSelect.value;
      const sorted = cards.slice();

      if (value === "year-desc") {
        sorted.sort(function (a, b) {
          return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
        });
      }

      if (value === "year-asc") {
        sorted.sort(function (a, b) {
          return Number(a.dataset.year || 0) - Number(b.dataset.year || 0);
        });
      }

      if (value === "title-asc") {
        sorted.sort(function (a, b) {
          return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "zh-Hans-CN");
        });
      }

      if (value === "default") {
        sorted.sort(function (a, b) {
          return cards.indexOf(a) - cards.indexOf(b);
        });
      }

      sorted.forEach(function (card) {
        grid.appendChild(card);
      });
    }

    if (input) {
      input.addEventListener("input", applyFilter);
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        applySort();
        applyFilter();
      });
    }

    applySort();
    applyFilter();
  }

  function setupPlayerShell(shell) {
    const video = shell.querySelector("video");
    const status = shell.querySelector("[data-player-status]");
    const playButtons = Array.from(shell.querySelectorAll("[data-play-toggle]"));
    const muteButton = shell.querySelector("[data-mute-toggle]");
    const fullscreenButton = shell.querySelector("[data-fullscreen-toggle]");
    const source = video ? video.getAttribute("data-src") : "";
    let readyPromise = null;

    if (!video || !source) {
      return;
    }

    function setStatus(message, hidden) {
      if (!status) {
        return;
      }

      status.textContent = message;
      status.classList.toggle("is-hidden", Boolean(hidden));
    }

    function attachStream() {
      if (readyPromise) {
        return readyPromise;
      }

      if (video.dataset.ready === "true") {
        return Promise.resolve();
      }

      setStatus("正在准备播放", false);

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        video.dataset.ready = "true";
        setStatus("播放源已就绪", true);
        readyPromise = Promise.resolve();
        return readyPromise;
      }

      readyPromise = loadHls()
        .then(function (Hls) {
          if (!Hls || !Hls.isSupported()) {
            throw new Error("hls-unsupported");
          }

          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });

          hls.loadSource(source);
          hls.attachMedia(video);
          video.hlsInstance = hls;
          video.dataset.ready = "true";

          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            setStatus("播放源已就绪", true);
          });

          hls.on(Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
              return;
            }

            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              setStatus("网络错误，正在重试", false);
              hls.startLoad();
              return;
            }

            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              setStatus("媒体错误，正在恢复", false);
              hls.recoverMediaError();
              return;
            }

            setStatus("当前浏览器无法播放", false);
          });
        })
        .catch(function () {
          setStatus("当前浏览器无法播放", false);
        });

      return readyPromise;
    }

    function togglePlay() {
      attachStream().then(function () {
        if (video.paused) {
          const playPromise = video.play();

          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {
              setStatus("点击视频区域继续播放", false);
            });
          }
        } else {
          video.pause();
        }
      });
    }

    playButtons.forEach(function (button) {
      button.addEventListener("click", togglePlay);
    });

    video.addEventListener("click", togglePlay);
    video.addEventListener("play", function () {
      shell.classList.add("is-playing");
      setStatus("播放中", true);
    });
    video.addEventListener("pause", function () {
      shell.classList.remove("is-playing");
    });
    video.addEventListener("loadedmetadata", function () {
      setStatus("播放源已就绪", true);
    });

    if (muteButton) {
      muteButton.addEventListener("click", function () {
        video.muted = !video.muted;
        muteButton.textContent = video.muted ? "取消静音" : "静音";
      });
    }

    if (fullscreenButton) {
      fullscreenButton.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          return;
        }

        if (shell.requestFullscreen) {
          shell.requestFullscreen();
        }
      });
    }

    attachStream();
  }

  function setupPlayers() {
    const shells = Array.from(document.querySelectorAll("[data-player]"));
    shells.forEach(setupPlayerShell);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileNav();
    setupHeroCarousel();
    setupSearchForms();
    setupFilters();
    setupPlayers();
  });
})();
