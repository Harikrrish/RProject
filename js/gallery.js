(() => {
  'use strict';
  const gallery = document.getElementById('design-grid');
  if (gallery) {
    const cards = [...gallery.querySelectorAll('.design-card')];
    const filters = [...document.querySelectorAll('.gallery-filters [data-filter]')];
    const more = document.getElementById('gallery-more');
    const status = document.getElementById('gallery-status');
    const count = document.getElementById('gallery-count');
    const dialog = document.getElementById('gallery-lightbox');
    const image = document.getElementById('lightbox-image');
    const title = document.getElementById('lightbox-title');
    const room = document.getElementById('lightbox-category');
    const position = document.getElementById('lightbox-count');
    let filter = 'all';
    let limit = 24;
    let selected = 0;
    let openedFrom = null;
    let previousOverflow = '';
    let enquiring = false;
    const matching = () => cards.filter(card => filter === 'all' || card.dataset.category === filter);
    function update() {
      const matches = matching();
      const visible = new Set(matches.slice(0, limit));
      cards.forEach(card => { card.hidden = !visible.has(card); });
      const text = `Showing ${visible.size} of ${matches.length} ${filter === 'all' ? 'designs' : 'designs in this room collection'}`;
      status.textContent = text;
      count.textContent = text;
      const viewLink = document.getElementById('gallery-room-view');
      const roomName = matches[0]?.dataset.room || 'Living rooms';
      viewLink.href = filter === 'all' ? '/studio.html' : '/studio.html?room=' + roomName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      viewLink.innerHTML = (filter === 'all' ? 'Explore 360° walkthroughs' : roomName + ' in 360° + 3D') + ' <span aria-hidden="true">↗</span>';
      more.hidden = visible.size >= matches.length;
      filters.forEach(button => {
        const current = button.dataset.filter === filter;
        button.classList.toggle('active', current);
        button.setAttribute('aria-pressed', String(current));
      });
    }
    filters.forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; limit = filter === 'all' ? 24 : Number.MAX_SAFE_INTEGER; update(); }));
    more.addEventListener('click', () => {
      const firstNew = matching()[limit];
      limit += 24;
      update();
      firstNew?.focus({ preventScroll:true });
    });
    function showImage(index) {
      const matches = matching();
      selected = (index + matches.length) % matches.length;
      const card = matches[selected];
      image.src = card.href;
      image.alt = card.querySelector('img').alt;
      title.textContent = card.dataset.label;
      room.textContent = card.dataset.room;
      position.textContent = `${selected + 1} of ${matches.length} designs`;
    }
    cards.forEach(card => card.addEventListener('click', event => {
      if (typeof dialog.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openedFrom = card;
      enquiring = false;
      showImage(matching().indexOf(card));
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      dialog.querySelector('.lightbox-close').focus();
    }));
    dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.lightbox-previous').addEventListener('click', () => showImage(selected - 1));
    dialog.querySelector('.lightbox-next').addEventListener('click', () => showImage(selected + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showImage(selected + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(selected - 1); }
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      const focusTarget = enquiring ? document.getElementById('contact-name') : openedFrom;
      focusTarget?.focus({ preventScroll:true });
    });
    document.getElementById('lightbox-enquire').addEventListener('click', () => { enquiring = true; dialog.close(); });
    update();
  }
  const reviews = document.querySelector('.reviews-track');
  if (reviews) document.querySelectorAll('[data-review-direction]').forEach(button => button.addEventListener('click', () => {
    const card = reviews.querySelector('.review-card');
    reviews.scrollBy({ left:(card.offsetWidth + parseFloat(getComputedStyle(reviews).gap)) * Number(button.dataset.reviewDirection), behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
})();
