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
    const successEl = document.querySelector('[data-contact-success]');
    const noteEl = document.querySelector('.contact-form__note');
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
        contactForm.classList.add('is-success');
        if (statusEl) {
          statusEl.textContent = '';
        }
        if (successEl) {
          successEl.hidden = false;
          successEl.classList.add('is-visible');
          successEl.focus();
        }
        if (noteEl) {
          noteEl.classList.add('is-hidden');
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
    const successEl = document.querySelector('[data-newsletter-success]');
    const noteEl = document.querySelector('.newsletter-note');
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
        newsletterForm.classList.add('is-success');
        if (statusEl) {
          statusEl.textContent = '';
        }
        if (successEl) {
          successEl.hidden = false;
          successEl.classList.add('is-visible');
          successEl.focus();
        }
        if (noteEl) {
          noteEl.classList.add('is-hidden');
        }
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = 'We could not subscribe you right now. Please try again or email info@sipeg.org.';
        }
      }
    });
  }

  const setCopyButtonLabel = (button, text) => {
    const label = button.querySelector('span');
    if (label) {
      label.textContent = text;
    } else {
      button.textContent = text;
    }
  };

  const copyText = async (value) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const helper = document.createElement('textarea');
    helper.value = value;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(helper);
    if (!copied) {
      throw new Error('Copy failed');
    }
  };

  document.querySelectorAll('.js-copy-link').forEach((button) => {
    if (button.dataset.copyBound === 'true') return;
    button.dataset.copyBound = 'true';

    button.addEventListener('click', async () => {
      const copyUrl = button.getAttribute('data-copy-url') || window.location.href;
      const label = button.querySelector('span');
      const originalText = label ? label.textContent : button.textContent;

      try {
        await copyText(copyUrl);
        setCopyButtonLabel(button, 'Copied');
      } catch (error) {
        setCopyButtonLabel(button, 'Failed');
      }

      window.setTimeout(() => {
        setCopyButtonLabel(button, originalText);
      }, 1800);
    });
  });

  const referencesHeadingPattern = /^(references|bibliography|works cited|sources)$/i;
  document.querySelectorAll('.research-single__body').forEach((body) => {
    if (body.dataset.enhancedTypography === 'true') return;
    body.dataset.enhancedTypography = 'true';

    const calloutPattern =
      /\b(download|feedback|comment|comments|view pdf|read the complete|for further reading|for further details)\b/i;
    body.querySelectorAll('p').forEach((paragraph) => {
      const rawText = (paragraph.textContent || '').replace(/\s+/g, ' ').trim();
      if (!rawText) {
        paragraph.remove();
        return;
      }

      if (
        paragraph.querySelector(
          'img, figure, video, iframe, table, ul, ol, blockquote, pre, code, object, embed'
        )
      ) {
        return;
      }

      const nextEl = paragraph.nextElementSibling;
      const nextLooksBody = !!nextEl && /^(P|UL|OL|BLOCKQUOTE)$/.test(nextEl.tagName);
      const wordCount = rawText.split(' ').filter(Boolean).length;
      const onlyEmphasis =
        paragraph.children.length === 1 &&
        /^(STRONG|B|EM|I)$/.test(paragraph.children[0].tagName);
      const endsWithColon = /[:：]\s*$/.test(rawText);
      const titleLike =
        /^[A-Z][A-Za-z0-9&/(),'"’\-\s]{4,120}$/.test(rawText) &&
        !/[.!?]/.test(rawText);
      const looksHeadingLikeLine =
        nextLooksBody &&
        wordCount <= 15 &&
        !calloutPattern.test(rawText) &&
        (onlyEmphasis || endsWithColon || titleLike);

      if (looksHeadingLikeLine) {
        const inferred = document.createElement('h3');
        inferred.className = 'inferred-heading';
        inferred.textContent = rawText.replace(/[:：]\s*$/, '');
        paragraph.replaceWith(inferred);
        return;
      }

      if (
        calloutPattern.test(rawText) &&
        (paragraph.querySelector('strong, em, b, i') || wordCount <= 85)
      ) {
        paragraph.classList.add('research-note-callout');
      }
    });

    const isHardWrappedCandidate = (paragraph) => {
      if (!paragraph || paragraph.tagName !== 'P') return false;
      if (paragraph.children.length > 0) return false;
      const text = (paragraph.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return false;
      if (text.length < 18 || text.length > 130) return false;
      if (text.split(' ').length < 4) return false;
      if (/[:：]\s*$/.test(text)) return false;
      if (/^[-*•\d]+\s/.test(text)) return false;
      if (calloutPattern.test(text)) return false;
      return true;
    };

    const normalizeSpacing = (text) =>
      text
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/\s{2,}/g, ' ')
        .trim();

    let child = body.firstElementChild;
    let insideReferences = false;
    while (child) {
      if (/^H[1-3]$/.test(child.tagName)) {
        insideReferences = referencesHeadingPattern.test(
          child.textContent.trim()
        );
      }

      if (insideReferences || !isHardWrappedCandidate(child)) {
        child = child.nextElementSibling;
        continue;
      }

      const group = [child];
      let cursor = child.nextElementSibling;
      while (isHardWrappedCandidate(cursor)) {
        group.push(cursor);
        cursor = cursor.nextElementSibling;
      }

      if (group.length >= 3) {
        const mergedText = normalizeSpacing(
          group.map((node) => node.textContent.trim()).join(' ')
        );
        group[0].textContent = mergedText;
        for (let i = 1; i < group.length; i += 1) {
          group[i].remove();
        }
      }

      child = cursor;
    }

    const citationCandidatePattern = /\(([^()]*\b(?:19|20)\d{2}[a-z]?[^()]*)\)/g;
    const citationEntryPattern =
      /^(?:[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,2}|[A-Z]\.\s*[A-Za-z.'-]+|[A-Za-z.'-]+\s+et al\.)\s*,\s*(?:19|20)\d{2}[a-z]?$/;
    const isLikelyInlineCitation = (innerText) => {
      const text = innerText.replace(/\s+/g, ' ').trim();
      if (!text || text.length > 90) return false;
      if (/\d{4}\s*[-–]\s*\d{2,4}/.test(text)) return false;
      if (/[!?]/.test(text)) return false;

      const segments = text
        .split(';')
        .map((segment) => segment.trim())
        .filter(Boolean);
      if (segments.length === 0 || segments.length > 4) return false;

      return segments.every((segment) => citationEntryPattern.test(segment));
    };
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    const citationTextNodes = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      const text = currentNode.nodeValue || '';
      const parent = currentNode.parentElement;
      if (
        text.includes('(') &&
        parent &&
        !parent.closest(
          '.references-block, .footnotes, blockquote, pre, code, h1, h2, h3, h4, h5, h6'
        ) &&
        citationCandidatePattern.test(text)
      ) {
        citationTextNodes.push(currentNode);
      }
      citationCandidatePattern.lastIndex = 0;
      currentNode = walker.nextNode();
    }

    citationTextNodes.forEach((textNode) => {
      const value = textNode.nodeValue || '';
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match = citationCandidatePattern.exec(value);

      while (match) {
        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(value.slice(lastIndex, match.index))
          );
        }
        const inner = (match[1] || '').trim();
        if (isLikelyInlineCitation(inner)) {
          const chip = document.createElement('span');
          chip.className = 'citation';
          chip.textContent = match[0];
          fragment.appendChild(chip);
        } else {
          fragment.appendChild(document.createTextNode(match[0]));
        }
        lastIndex = match.index + match[0].length;
        match = citationCandidatePattern.exec(value);
      }

      if (lastIndex < value.length) {
        fragment.appendChild(document.createTextNode(value.slice(lastIndex)));
      }
      citationCandidatePattern.lastIndex = 0;
      textNode.parentNode.replaceChild(fragment, textNode);
    });

    body.querySelectorAll('h2, h3').forEach((heading) => {
      if (heading.dataset.referencesStyled === 'true') return;
      if (!referencesHeadingPattern.test(heading.textContent.trim())) return;

      const block = document.createElement('div');
      block.className = 'references-block';
      let hasEntries = false;
      let sibling = heading.nextElementSibling;

      while (sibling && !/^H[1-3]$/.test(sibling.tagName)) {
        const next = sibling.nextElementSibling;

        if (sibling.tagName === 'P' && sibling.textContent.trim() !== '') {
          sibling.classList.add('reference-entry');
          hasEntries = true;
        }

        if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
          Array.from(sibling.children).forEach((item) => {
            if (item.tagName === 'LI') {
              item.classList.add('reference-entry');
              hasEntries = true;
            }
          });
        }

        block.appendChild(sibling);
        sibling = next;
      }

      if (!hasEntries) return;
      heading.dataset.referencesStyled = 'true';
      heading.classList.add('references-heading');
      heading.insertAdjacentElement('afterend', block);
    });
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[href^="#"]');
    if (!target) return;
    const hash = target.getAttribute('href');
    if (!hash || hash.charAt(0) !== '#') return;
    const section = document.querySelector(hash);
    if (!section) return;
    const registerSection = section.matches('[data-register-section]')
      ? section
      : section.querySelector('[data-register-section]');
    if (!registerSection) return;

    event.preventDefault();
    const offset = 180;
    const top =
      registerSection.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    registerSection.focus({ preventScroll: true });
  });
})();
