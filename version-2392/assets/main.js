(function () {
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = hero.querySelector('[data-hero-dots]');
    if (!slides.length || !dots) {
      return;
    }
    var index = 0;
    var buttons = slides.map(function (_, i) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', '切换推荐影片');
      button.addEventListener('click', function () {
        show(i);
      });
      dots.appendChild(button);
      return button;
    });
    function show(next) {
      slides[index].classList.remove('active');
      buttons[index].classList.remove('active');
      index = next;
      slides[index].classList.add('active');
      buttons[index].classList.add('active');
    }
    buttons[0].classList.add('active');
    window.setInterval(function () {
      show((index + 1) % slides.length);
    }, 5200);
  }

  function initFilters() {
    var input = document.querySelector('[data-card-search]');
    var select = document.querySelector('[data-year-filter]');
    var list = document.querySelector('[data-card-list]');
    if (!list || (!input && !select)) {
      return;
    }
    var cards = Array.prototype.slice.call(list.children);
    function matchYear(card, value) {
      if (!value) {
        return true;
      }
      var year = Number(card.getAttribute('data-year') || 0);
      if (value === '2010') {
        return year >= 2010 && year < 2020;
      }
      if (value === '2000') {
        return year > 0 && year < 2010;
      }
      return String(year) === value;
    }
    function apply() {
      var query = input ? input.value.trim().toLowerCase() : '';
      var yearValue = select ? select.value : '';
      cards.forEach(function (card) {
        var haystack = card.textContent.toLowerCase();
        var ok = (!query || haystack.indexOf(query) !== -1) && matchYear(card, yearValue);
        card.classList.toggle('hidden-card', !ok);
      });
    }
    if (input) {
      input.addEventListener('input', apply);
    }
    if (select) {
      select.addEventListener('change', apply);
    }
  }

  function initImages() {
    var images = document.querySelectorAll('img');
    images.forEach(function (img) {
      img.addEventListener('error', function () {
        img.style.display = 'none';
      });
    });
  }

  function initPlayers() {
    var players = document.querySelectorAll('[data-player]');
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-play-button]');
      if (!video || !button) {
        return;
      }
      var source = video.getAttribute('data-src');
      var loaded = false;
      function attachSource() {
        if (loaded || !source) {
          return;
        }
        loaded = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else {
          video.src = source;
        }
      }
      function play() {
        attachSource();
        button.classList.add('hidden');
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            button.classList.remove('hidden');
          });
        }
      }
      button.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        button.classList.add('hidden');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHero();
    initFilters();
    initImages();
    initPlayers();
  });
})();
