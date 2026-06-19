(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupHero() {
    var carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
    var prev = carousel.querySelector("[data-hero-prev]");
    var next = carousel.querySelector("[data-hero-next]");
    var index = slides.findIndex(function (slide) {
      return slide.classList.contains("active");
    });
    if (index < 0) {
      index = 0;
    }

    function showSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var target = Number(dot.getAttribute("data-slide"));
        showSlide(target);
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        showSlide(index - 1);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(index + 1);
      });
    }

    window.setInterval(function () {
      showSlide(index + 1);
    }, 6200);
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));
    scopes.forEach(function (scope) {
      var search = scope.querySelector(".js-card-search");
      var region = scope.querySelector(".js-region-filter");
      var type = scope.querySelector(".js-type-filter");
      var year = scope.querySelector(".js-year-filter");
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
      var empty = scope.querySelector("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q");

      if (search && query) {
        search.value = query;
      }

      function apply() {
        var searchValue = normalize(search && search.value);
        var regionValue = normalize(region && region.value);
        var typeValue = normalize(type && type.value);
        var yearValue = normalize(year && year.value);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-tags")
          ].join(" "));
          var matched = true;
          if (searchValue && haystack.indexOf(searchValue) === -1) {
            matched = false;
          }
          if (regionValue && normalize(card.getAttribute("data-region")) !== regionValue) {
            matched = false;
          }
          if (typeValue && normalize(card.getAttribute("data-type")) !== typeValue) {
            matched = false;
          }
          if (yearValue && normalize(card.getAttribute("data-year")) !== yearValue) {
            matched = false;
          }
          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      }

      [search, region, type, year].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
      apply();
    });
  }

  function setupPlayer() {
    var player = document.querySelector(".movie-player");
    if (!player) {
      return;
    }
    var video = player.querySelector("video");
    var button = player.querySelector(".js-play-button");
    var message = player.querySelector(".player-message");
    var stream = player.getAttribute("data-stream");
    var hls = null;
    var attached = false;

    function showMessage(text) {
      if (!message) {
        return;
      }
      message.textContent = text;
      message.classList.add("show");
    }

    function attachStream() {
      if (attached) {
        return Promise.resolve();
      }
      attached = true;
      video.controls = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        return video.play();
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showMessage("视频暂时无法播放，请稍后再试。");
          }
        });
        return new Promise(function (resolve, reject) {
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().then(resolve).catch(reject);
          });
        });
      }

      showMessage("视频暂时无法播放，请稍后再试。");
      return Promise.reject(new Error("unavailable"));
    }

    function startPlayback() {
      player.classList.add("is-loading");
      attachStream().then(function () {
        player.classList.add("is-playing");
        player.classList.remove("is-loading");
      }).catch(function () {
        player.classList.remove("is-loading");
      });
    }

    if (button) {
      button.addEventListener("click", startPlayback);
    }

    video.addEventListener("click", function () {
      if (!attached) {
        startPlayback();
      }
    });

    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  onReady(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayer();
  });
}());
