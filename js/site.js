(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Open navigation');
  };
  navToggle?.addEventListener('click', () => {
    const opened = navToggle.getAttribute('aria-expanded') !== 'true';
    nav?.classList.toggle('is-open', opened);
    navToggle.setAttribute('aria-expanded', String(opened));
    navToggle.setAttribute('aria-label', opened ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu(); navToggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', closeMenu);
  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });
  const transformation = document.getElementById('transformation');
  if (transformation) {
    const scenes = [...transformation.querySelectorAll('.hero-scene')];
    const controls = [...transformation.querySelectorAll('[data-stage]')];
    const captions = ['A fresh start. A clear plan.', 'The details behind every wall.', 'Craftsmanship, piece by piece.', 'The finishing touches come together.', 'The work is done. The living begins.'];
    const progressBar = document.getElementById('scene-progress');
    let scheduled = false;
    let activeStage = -1;
    const clamp = n => Math.max(0, Math.min(1, n));
    function paint(progress) {
      const position = progress * (scenes.length - 1);
      scenes.forEach((scene, i) => { scene.style.opacity = String(i === 0 ? 1 : clamp((position - i + .7) / .7)); });
      const stage = Math.min(scenes.length - 1, Math.floor(position + .35));
      if (stage !== activeStage) {
        activeStage = stage;
        document.getElementById('scene-number').textContent = `0${stage + 1} / 0${scenes.length}`;
        document.getElementById('scene-title').textContent = captions[stage];
        controls.forEach((button, i) => {
          button.classList.toggle('active', i === stage);
          button.setAttribute('aria-pressed', String(i === stage));
        });
      }
      progressBar.style.width = `${Math.max(5, progress * 100)}%`;
    }
    function update() {
      scheduled = false;
      if (reducedMotion.matches) return;
      const headerHeight = document.querySelector('.site-header').offsetHeight;
      const range = transformation.offsetHeight - transformation.querySelector('.hero-sticky').offsetHeight;
      const progress = clamp((headerHeight - transformation.getBoundingClientRect().top) / Math.max(1, range));
      paint(progress);
    }
    function queueUpdate() {
      if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
    }
    function configureMotion() {
      document.documentElement.classList.toggle('motion-enabled', !reducedMotion.matches);
      if (reducedMotion.matches) paint(1); else update();
    }
    controls.forEach((button, i) => button.addEventListener('click', () => {
      const progress = i / (scenes.length - 1);
      if (reducedMotion.matches) { paint(progress); return; }
      const headerHeight = document.querySelector('.site-header').offsetHeight;
      const start = transformation.getBoundingClientRect().top + window.scrollY - headerHeight;
      const range = transformation.offsetHeight - transformation.querySelector('.hero-sticky').offsetHeight;
      window.scrollTo({ top: start + range * progress, behavior: 'smooth' });
    }));
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate, { passive: true });
    reducedMotion.addEventListener('change', configureMotion);
    configureMotion();
  }
  const form = document.getElementById('consultation-form');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || form.elements.website.value) return;
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    const status = document.getElementById('form-status');
    const originalLabel = button.innerHTML;
    const payload = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.replace(/[^\d]/g, '').replace(/^91(?=\d{10}$)/, ''),
      email: form.elements.email.value.trim()
    };
    if (payload.name.length < 2) {
      status.textContent = 'Please enter your name.'; status.className = 'form-status error'; return;
    }
    button.disabled = true;
    button.textContent = 'Sending your enquiry…';
    status.className = 'form-status';
    status.textContent = 'Please wait while we send your details.';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://rprojectmail-production.up.railway.app', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      if (!response.ok) throw new Error('Enquiry service unavailable');
      const type = response.headers.get('content-type') || '';
      if (type.includes('application/json')) {
        const result = await response.json();
        if (result.success === false || result.error) throw new Error('Enquiry was not accepted');
      }
      status.className = 'form-status success';
      status.textContent = 'Thank you. Your enquiry has been sent to Alankaar Interiors. We’ll get in touch to discuss your space.';
      form.reset();
    } catch {
      status.className = 'form-status error';
      status.textContent = 'Your enquiry could not be sent. Your details are still here so you can try again, or call us on +91 99949 58369.';
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  });

  // Retain the existing Google Ads tag on the live domain. Local previews and
  // automated browser tests never send analytics or conversion traffic.
  if (['alankaarinteriors.com', 'www.alankaarinteriors.com'].includes(location.hostname)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'AW-16767062044');
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=AW-16767062044';
    document.head.appendChild(tag);
  }
})();
