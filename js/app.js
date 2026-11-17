(() => {
  'use strict';
  const CONFIG = {
    PIXEL_ID: 'PIXEL_ID_AQUI',
    CHECKOUT_URL_BASICO: '#checkout-basico',
    CHECKOUT_URL_PREMIUM: '#checkout-premium',
    CHECKOUT_URL_DOWNSELL: '#checkout-downsell'
  };
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const params = read('pv_tracking_params', {});
  new URLSearchParams(location.search).forEach((value, key) => {
    if (/^utm_|^(fbclid|gclid|src|sck|ad_id)$/.test(key)) params[key] = value;
  });
  save('pv_tracking_params', params);
  const checkoutUrl = (raw) => {
    const hashAt = raw.indexOf('#');
    const hash = hashAt < 0 ? '' : raw.slice(hashAt);
    const base = hashAt < 0 ? raw : raw.slice(0, hashAt);
    const queryAt = base.indexOf('?');
    const path = queryAt < 0 ? base : base.slice(0, queryAt);
    const query = new URLSearchParams(queryAt < 0 ? '' : base.slice(queryAt + 1));
    Object.entries(params).forEach(([key, value]) => { if (!query.has(key)) query.set(key, value); });
    return path + (query.size ? '?' + query.toString() : '') + hash;
  };
  document.querySelectorAll('.cta-checkout').forEach(link => {
    const kind = link.dataset.checkout;
    const raw = kind === 'basico' ? CONFIG.CHECKOUT_URL_BASICO : kind === 'downsell' ? CONFIG.CHECKOUT_URL_DOWNSELL : CONFIG.CHECKOUT_URL_PREMIUM;
    link.href = checkoutUrl(raw);
  });
  // Usa somente um pixel já instalado pelo proprietário; não carrega pixel fictício.
  document.addEventListener('click', event => {
    const link = event.target.closest('.cta-checkout');
    if (!link || link.id === 'checkout-basico') return;
    if (typeof window.fbq === 'function') window.fbq('track', 'InitiateCheckout');
    document.dispatchEvent(new CustomEvent('atlas:checkout', { detail: { plan: link.dataset.checkout, href: link.href } }));
  });
  let deadline = read('atlas_offer_deadline', null);
  if (typeof deadline !== 'number' || !Number.isFinite(deadline)) { deadline = Date.now() + 15 * 60 * 1000; save('atlas_offer_deadline', deadline); }
  const tick = () => {
    const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    const text = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    document.querySelectorAll('.timer').forEach(timer => { timer.textContent = text; });
  };
  tick(); setInterval(tick, 1000);
  let activeModal = null, previousFocus = null;
  const closeModal = () => {
    if (!activeModal) return;
    activeModal.classList.remove('is-open'); activeModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open'); activeModal = null;
    previousFocus?.focus({ preventScroll: true });
  };
  const openModal = (modal, target) => {
    previousFocus = document.activeElement; activeModal = modal;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open'); target.focus({ preventScroll: true });
    modal.querySelector('.modal-box').scrollTop = 0;
  };
  const downsell = document.getElementById('downsell-modal');
  document.getElementById('checkout-basico').addEventListener('click', event => {
    event.preventDefault(); openModal(downsell, document.getElementById('checkout-downsell'));
  });
  document.querySelectorAll('.modal').forEach(modal => {
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  });
  document.addEventListener('keydown', event => {
    if (!activeModal) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab') {
      const items = [...activeModal.querySelectorAll('a[href],button')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  ['checkout-downsell','downsell-decline'].forEach(id => document.getElementById(id).addEventListener('click', closeModal));
  document.querySelectorAll('.lightbox-trigger').forEach(button => button.addEventListener('click', () => {
    const img = button.querySelector('img').cloneNode(); img.loading = 'eager'; img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.src = button.dataset.full;
    document.getElementById('lightbox-content').replaceChildren(img);
    openModal(document.getElementById('lightbox-modal'), document.getElementById('lightbox-close'));
  }));
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('motion');
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); reveal.unobserve(entry.target); }
    }), { threshold: .06 });
    document.querySelectorAll('.rv').forEach(el => reveal.observe(el));
    const visible = { hero: true, planos: false, fechamento: false };
    let heroPassed = false;
    const sticky = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        visible[entry.target.id] = entry.isIntersecting;
        if (entry.target.id === 'hero') heroPassed = entry.boundingClientRect.bottom <= 0;
      });
      document.getElementById('sticky-cta').classList.toggle('is-visible', heroPassed && !visible.hero && !visible.planos && !visible.fechamento);
    }, { threshold: 0 });
    ['hero','planos','fechamento'].forEach(id => sticky.observe(document.getElementById(id)));
    let viewed = false;
    new IntersectionObserver(entries => {
      if (!viewed && entries.some(e => e.isIntersecting)) {
        viewed = true;
        if (typeof window.fbq === 'function') window.fbq('track', 'ViewContent');
      }
    }).observe(document.getElementById('planos'));
  }
})();
