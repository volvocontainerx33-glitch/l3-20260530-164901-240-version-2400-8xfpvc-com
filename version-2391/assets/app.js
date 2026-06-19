(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function toggleMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initFilters() {
    var scope = document.querySelector("[data-filter-scope]");
    if (!scope) {
      return;
    }
    var input = scope.querySelector("[data-filter-input]");
    var year = scope.querySelector("[data-filter-year]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    function apply() {
      var keyword = normalize(input && input.value);
      var selectedYear = year ? year.value : "";
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre")
        ].join(" "));
        var cardYear = card.getAttribute("data-year") || "";
        var matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchedYear = !selectedYear || cardYear === selectedYear;
        card.style.display = matchedKeyword && matchedYear ? "" : "none";
      });
    }
    if (input) {
      input.addEventListener("input", apply);
    }
    if (year) {
      year.addEventListener("change", apply);
    }
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 2).map(function (tag) {
      return "<span>" + escapeHTML(tag) + "</span>";
    }).join("");
    return "<article class=\"movie-card\">" +
      "<a class=\"poster-link\" href=\"" + escapeHTML(movie.url) + "\" aria-label=\"观看 " + escapeHTML(movie.title) + "\">" +
      "<img src=\"" + escapeHTML(movie.cover) + "\" alt=\"" + escapeHTML(movie.title) + "\" loading=\"lazy\">" +
      "<span class=\"poster-shade\"></span>" +
      "<span class=\"play-float\">▶</span>" +
      "<span class=\"duration-badge\">" + escapeHTML(movie.duration) + "</span>" +
      "</a>" +
      "<div class=\"movie-card-body\">" +
      "<h3><a href=\"" + escapeHTML(movie.url) + "\">" + escapeHTML(movie.title) + "</a></h3>" +
      "<p>" + escapeHTML(movie.oneLine || movie.summary) + "</p>" +
      "<div class=\"card-meta\"><span>" + escapeHTML(movie.year) + "</span><span>" + escapeHTML(movie.region) + "</span><span>" + escapeHTML(movie.category) + "</span></div>" +
      "<div class=\"tag-row\">" + tags + "</div>" +
      "</div>" +
      "</article>";
  }

  window.initSearchPage = function () {
    ready(function () {
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q") || "";
      var formInput = document.querySelector("[data-search-input]");
      var results = document.querySelector("[data-search-results]");
      var status = document.querySelector("[data-search-status]");
      if (formInput) {
        formInput.value = query;
      }
      if (!results || !status) {
        return;
      }
      if (!query.trim()) {
        return;
      }
      var q = normalize(query);
      var list = (window.movieIndex || []).filter(function (movie) {
        return normalize([
          movie.title,
          movie.region,
          movie.genre,
          movie.category,
          (movie.tags || []).join(" "),
          movie.oneLine,
          movie.summary
        ].join(" ")).indexOf(q) !== -1;
      });
      status.textContent = "搜索 “" + query + "” 找到 " + list.length + " 个结果";
      results.innerHTML = list.slice(0, 240).map(cardTemplate).join("");
    });
  };

  window.setupPlayer = function (streamUrl) {
    ready(function () {
      var player = document.querySelector("[data-player]");
      var video = document.querySelector("[data-player-video]");
      var startButton = document.querySelector("[data-player-start]");
      if (!player || !video || !startButton || !streamUrl) {
        return;
      }
      var loaded = false;
      var hls = null;
      function load() {
        if (loaded) {
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        }
        loaded = true;
      }
      function play() {
        load();
        startButton.classList.add("is-hidden");
        video.setAttribute("controls", "controls");
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            startButton.classList.remove("is-hidden");
          });
        }
      }
      startButton.addEventListener("click", play);
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        }
      });
      window.addEventListener("pagehide", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  };

  ready(function () {
    toggleMenu();
    initFilters();
  });
})();
