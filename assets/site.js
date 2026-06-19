import { H as Hls } from './hls-vendor.js';

const ready = (fn) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
};

ready(() => {
  initNav();
  initSearch();
  initHeroCarousel();
  initPlayer();
  initScrollLinks();
});

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

function initSearch() {
  document.querySelectorAll('[data-search-scope]').forEach((scope) => {
    const input = scope.querySelector('[data-search-input]');
    const cards = Array.from(scope.querySelectorAll('[data-search-card]'));
    const counter = scope.querySelector('[data-search-count]');
    const empty = scope.querySelector('[data-search-empty]');
    if (!input || cards.length === 0) return;

    const apply = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach((card) => {
        const hay = (card.dataset.search || card.textContent || '').toLowerCase();
        const ok = !q || hay.includes(q);
        card.classList.toggle('hidden', !ok);
        if (ok) shown += 1;
      });
      if (counter) counter.textContent = String(shown);
      if (empty) empty.classList.toggle('hidden', shown !== 0);
    };

    input.addEventListener('input', apply);
    apply();
  });
}

function initHeroCarousel() {
  const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
  if (slides.length < 2) return;

  let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
  const activate = (nextIndex) => {
    slides[index].classList.remove('is-active');
    index = nextIndex;
    slides[index].classList.add('is-active');
  };

  window.setInterval(() => {
    activate((index + 1) % slides.length);
  }, 4600);
}

function initPlayer() {
  document.querySelectorAll('video[data-hls-src]').forEach((video) => {
    const hlsSrc = video.dataset.hlsSrc;
    const mp4Src = video.dataset.mp4Src || video.querySelector('source[type="video/mp4"]')?.getAttribute('src');
    if (!hlsSrc) return;

    const useNative = video.canPlayType('application/vnd.apple.mpegurl');
    if (useNative) {
      video.src = hlsSrc;
      return;
    }

    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data && data.fatal && mp4Src && !video.dataset.fallbackApplied) {
          video.dataset.fallbackApplied = '1';
          video.src = mp4Src;
        }
      });
      return;
    }

    if (mp4Src) {
      video.src = mp4Src;
    }
  });
}

function initScrollLinks() {
  document.querySelectorAll('[data-scroll-to]').forEach((button) => {
    const target = button.getAttribute('data-scroll-to');
    if (!target) return;
    button.addEventListener('click', () => {
      const node = document.querySelector(target);
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}\n