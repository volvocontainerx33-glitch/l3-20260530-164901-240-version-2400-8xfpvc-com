(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var toggle = qs('[data-menu-toggle]');
  var menu = qs('[data-mobile-menu]');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
      toggle.textContent = menu.classList.contains('is-open') ? '✕' : '☰';
    });
  }

  qsa('[data-hero]').forEach(function (hero) {
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var current = 0;
    var timer;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  });

  function applyFilter(root) {
    var input = qs('[data-search-input]', root) || qs('[name="q"]', root);
    var typeSelect = qs('[data-type-filter]', root);
    var cards = qsa('[data-card]', root);

    if (!cards.length) {
      cards = qsa('[data-card]');
    }

    var query = input ? input.value.trim().toLowerCase() : '';
    var type = typeSelect ? typeSelect.value : '';

    cards.forEach(function (card) {
      var text = ((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-tags') || '')).toLowerCase();
      var cardType = card.getAttribute('data-type') || '';
      var matchedQuery = !query || text.indexOf(query) !== -1;
      var matchedType = !type || cardType === type;
      card.classList.toggle('hidden-card', !(matchedQuery && matchedType));
    });
  }

  qsa('[data-search-area]').forEach(function (area) {
    var input = qs('[data-search-input]', area);
    var typeSelect = qs('[data-type-filter]', area);
    var button = qs('[data-search-button]', area);

    if (!input && !typeSelect) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');

    if (query && input) {
      input.value = query;
    }

    if (input) {
      input.addEventListener('input', function () {
        applyFilter(area);
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        applyFilter(area);
      });
    }

    if (button) {
      button.addEventListener('click', function () {
        applyFilter(area);
      });
    }

    applyFilter(area);
  });

  window.initMoviePlayer = function (source) {
    var video = qs('[data-movie-player]');
    var trigger = qs('[data-play-trigger]');
    var attached = false;
    var hlsInstance = null;

    function attach() {
      if (attached || !video || !source) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
      } else {
        video.src = source;
      }

      attached = true;
    }

    function start() {
      attach();
      if (trigger) {
        trigger.classList.add('is-hidden');
      }
      var playTask = video && video.play ? video.play() : null;
      if (playTask && playTask.catch) {
        playTask.catch(function () {});
      }
    }

    if (trigger) {
      trigger.addEventListener('click', start);
    }

    if (video) {
      video.addEventListener('play', function () {
        if (trigger) {
          trigger.classList.add('is-hidden');
        }
      });
      video.addEventListener('click', function () {
        attach();
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance && hlsInstance.destroy) {
        hlsInstance.destroy();
      }
    });
  };
})();
