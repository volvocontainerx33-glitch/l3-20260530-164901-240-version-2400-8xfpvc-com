(function () {
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const normalize = (value) => (value || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，,。\.、\-_/|:：;；()（）【】\[\]']/g, '');

  const showBodyNav = () => {
    document.body.classList.toggle('nav-open');
  };

  const initNav = () => {
    const toggle = document.querySelector('[data-nav-toggle]');
    if (toggle) {
      toggle.addEventListener('click', showBodyNav);
    }
    document.querySelectorAll('[data-close-nav]').forEach((item) => {
      item.addEventListener('click', () => document.body.classList.remove('nav-open'));
    });
  };

  const initSliders = () => {
    document.querySelectorAll('[data-slider]').forEach((slider) => {
      const slides = Array.from(slider.querySelectorAll('[data-slide]'));
      const dots = Array.from(slider.querySelectorAll('[data-dot]'));
      const prev = slider.querySelector('[data-prev]');
      const next = slider.querySelector('[data-next]');
      if (!slides.length) return;

      let index = slides.findIndex((item) => item.classList.contains('is-active'));
      if (index < 0) index = 0;
      let timer = null;

      const activate = (nextIndex) => {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      };

      const step = (delta) => activate(index + delta);
      const start = () => {
        stop();
        timer = window.setInterval(() => step(1), 5200);
      };
      const stop = () => {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      };

      if (prev) prev.addEventListener('click', () => { step(-1); start(); });
      if (next) next.addEventListener('click', () => { step(1); start(); });
      dots.forEach((dot, i) => dot.addEventListener('click', () => { activate(i); start(); }));
      slider.addEventListener('mouseenter', stop);
      slider.addEventListener('mouseleave', start);
      activate(index);
      start();
    });
  };

  const initFilters = () => {
    document.querySelectorAll('[data-filter-root]').forEach((root) => {
      const input = root.querySelector('[data-filter-input]');
      const select = root.querySelector('[data-filter-year]');
      const counter = root.querySelector('[data-filter-count]');
      const cards = Array.from(root.querySelectorAll('[data-card]'));
      if (!cards.length) return;

      const apply = () => {
        const query = normalize(input ? input.value : '');
        const year = select ? select.value : 'all';
        let visible = 0;
        cards.forEach((card) => {
          const hay = normalize(card.dataset.search || '');
          const matchQuery = !query || hay.includes(query);
          const matchYear = year === 'all' || card.dataset.year === year;
          const visibleNow = matchQuery && matchYear;
          card.classList.toggle('hide', !visibleNow);
          if (visibleNow) visible += 1;
        });
        if (counter) counter.textContent = String(visible);
      };

      if (input) input.addEventListener('input', apply);
      if (select) select.addEventListener('change', apply);
      apply();
    });
  };

  const initPlayers = () => {
    document.querySelectorAll('[data-player]').forEach((player) => {
      const video = player.querySelector('video');
      const playBtn = player.querySelector('[data-play]');
      const hlsSrc = player.dataset.hls || '';
      const mp4Src = player.dataset.mp4 || '';
      if (!video || (!hlsSrc && !mp4Src)) return;

      const attachSource = () => {
        if (hlsSrc && window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(hlsSrc);
          hls.attachMedia(video);
          player._hls = hls;
          return;
        }

        if (hlsSrc && video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = hlsSrc;
          return;
        }

        video.src = mp4Src || hlsSrc;
      };

      const tryPlay = () => {
        player.classList.add('is-playing');
        video.play().catch(() => {
          player.classList.remove('is-playing');
        });
      };

      if (playBtn) playBtn.addEventListener('click', tryPlay);
      video.addEventListener('click', tryPlay);
      video.addEventListener('play', () => player.classList.add('is-playing'));
      video.addEventListener('pause', () => player.classList.remove('is-playing'));
      attachSource();
    });
  };

  ready(() => {
    initNav();
    initSliders();
    initFilters();
    initPlayers();
  });
})();
