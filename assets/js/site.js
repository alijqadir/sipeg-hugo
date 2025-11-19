(function () {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');
  const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select';
  let previousFocus = null;

  if (navToggle && navMenu) {
    const hamburger = navToggle.querySelector('[data-hamburger]');
    const setHamburgerState = (isOpen) => {
      if (!hamburger) return;
      hamburger.classList.toggle('is-active', !!isOpen);
    };

    const closeMenu = () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setHamburgerState(false);
      if (previousFocus) {
        previousFocus.focus();
      }
      previousFocus = null;
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navMenu.setAttribute('aria-hidden', String(!isOpen));
      setHamburgerState(isOpen);
      if (isOpen) {
        previousFocus = document.activeElement;
        const firstFocusable = navMenu.querySelector(focusableSelectors);
        if (firstFocusable) {
          firstFocusable.focus();
        }
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('is-open')) {
        closeMenu();
      }
    });

    navMenu.addEventListener('click', (event) => {
      if (event.target.matches('a')) {
        closeMenu();
      }
    });

    const breakpoint = window.matchMedia('(min-width: 961px)');
    const handleBreakpoint = (event) => {
      if (event.matches) {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = '';
        setHamburgerState(false);
      }
    };
    handleBreakpoint(breakpoint);
    breakpoint.addEventListener('change', handleBreakpoint);
  }

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    const statusEl = contactForm.querySelector('[data-contact-status]');
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const honeypot = contactForm.querySelector('input[name="hp_field"]');
      if (honeypot && honeypot.value.trim() !== '') return;

      if (statusEl) {
        statusEl.textContent = 'Sending…';
        statusEl.setAttribute('aria-live', 'polite');
      }

      const endpoint = contactForm.dataset.endpoint;
      const formData = new FormData(contactForm);

      try {
        if (!endpoint) throw new Error('Missing endpoint');
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
        const text = await response.text();
        if (!response.ok || !text.toLowerCase().includes('ok')) {
          throw new Error(text || 'Network response was not ok');
        }

        contactForm.reset();
        if (statusEl) {
          statusEl.textContent = 'Thank you for reaching out. We will respond shortly.';
        }
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = 'We were unable to submit the form. Please email info@sipeg.org.';
        }
      }
    });
  }

  const newsletterForm = document.querySelector('[data-newsletter-form]');
  if (newsletterForm) {
    const statusEl = newsletterForm.querySelector('[data-newsletter-status]');
    newsletterForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const honeypot = newsletterForm.querySelector('input[name="hp_field"]');
      if (honeypot && honeypot.value.trim() !== '') return;

      if (statusEl) {
        statusEl.textContent = 'Subscribing…';
      }

      const endpoint = newsletterForm.dataset.endpoint;
      const formData = new FormData(newsletterForm);

      try {
        if (!endpoint) throw new Error('Missing endpoint');
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
        const text = await response.text();
        if (!response.ok || !text.toLowerCase().includes('ok')) {
          throw new Error(text || 'Network response was not ok');
        }
        newsletterForm.reset();
        if (statusEl) {
          statusEl.textContent = 'Thanks for subscribing! Check your inbox for confirmation.';
        }
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = 'We could not subscribe you right now. Please try again or email info@sipeg.org.';
        }
      }
    });
  }
})();
