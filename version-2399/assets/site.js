(function () {
  var mobileToggle = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var currentSlide = 0;
  var slideTimer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    currentSlide = (index + slides.length) % slides.length;

    slides.forEach(function (slide, i) {
      slide.classList.toggle('active', i === currentSlide);
    });

    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function startHero() {
    if (slides.length < 2) {
      return;
    }

    slideTimer = window.setInterval(nextSlide, 5200);
  }

  function resetHero() {
    if (slideTimer) {
      window.clearInterval(slideTimer);
    }
    startHero();
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
      resetHero();
    });
  });

  var prev = document.querySelector('[data-hero-prev]');
  var next = document.querySelector('[data-hero-next]');

  if (prev) {
    prev.addEventListener('click', function () {
      showSlide(currentSlide - 1);
      resetHero();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      showSlide(currentSlide + 1);
      resetHero();
    });
  }

  startHero();

  var panel = document.getElementById('searchPanel');
  var resultBox = document.querySelector('[data-search-results]');
  var closeButton = document.querySelector('[data-search-close]');
  var index = Array.isArray(window.SEARCH_INDEX) ? window.SEARCH_INDEX : [];

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function renderSearch(query) {
    if (!panel || !resultBox) {
      return;
    }

    var value = normalize(query);
    var matches = index.filter(function (item) {
      return normalize(item.title + ' ' + item.region + ' ' + item.type + ' ' + item.year + ' ' + item.genre + ' ' + item.category).indexOf(value) !== -1;
    }).slice(0, 40);

    if (!value) {
      matches = index.slice(0, 20);
    }

    resultBox.innerHTML = matches.map(function (item) {
      return '<a class="search-result-item" href="' + item.url + '">' +
        '<img src="' + item.image + '" alt="' + escapeHtml(item.title) + '">' +
        '<span><strong>' + escapeHtml(item.title) + '</strong><br>' +
        '<small>' + escapeHtml(item.year) + ' · ' + escapeHtml(item.region) + ' · ' + escapeHtml(item.genre) + '</small></span>' +
        '</a>';
    }).join('') || '<p>未找到相关视频</p>';

    panel.hidden = false;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-search-form]')).forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      renderSearch(input ? input.value : '');
    });
  });

  if (closeButton && panel) {
    closeButton.addEventListener('click', function () {
      panel.hidden = true;
    });
  }

  if (panel) {
    panel.addEventListener('click', function (event) {
      if (event.target === panel) {
        panel.hidden = true;
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-local-filter]')).forEach(function (form) {
    var input = form.querySelector('[data-local-filter-input]');
    var list = document.querySelector('[data-local-filter-list]');

    if (!input || !list) {
      return;
    }

    function applyFilter() {
      var value = normalize(input.value);
      Array.prototype.slice.call(list.querySelectorAll('.movie-card')).forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.textContent
        ].join(' '));
        card.classList.toggle('is-hidden', value && haystack.indexOf(value) === -1);
      });
    }

    input.addEventListener('input', applyFilter);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      applyFilter();
    });
  });
})();
