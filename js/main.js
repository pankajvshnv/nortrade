'use strict';

/* ---  --- */
let currentLang = localStorage.getItem('nortrade-lang') || 'fr';
let chatbotOpen = false;
let lenis;

async function loadComponents() {
  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch('components/header.html?v=3'),
      fetch('components/footer.html?v=3')
    ]);
    const headerHtml = await headerRes.text();
    const footerHtml = await footerRes.text();

    const headerPh = document.getElementById('header-placeholder');
    const footerPh = document.getElementById('footer-placeholder');
    if (headerPh) headerPh.outerHTML = headerHtml;
    if (footerPh) footerPh.outerHTML = footerHtml;
  } catch (err) {
    console.error('Error loading components:', err);
  }
}

/* ---  --- */
document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();

  initSmoothScroll();
  initPreloader();
  initCookieBanner();
  initLanguage();
  initNavigation();
  initScrollReveal();
  initParallax();
  initHeroFade();
  initCustomCursor();
  initContactForm();
  initChatbot();
  initMobileMenu();
  initServicesScroll();
  initImageLoading();
  initAboutScroll();
  initFAQ();
  initHeroVideoPlaylist();
  initEdgeButtonsVisibility();
});

function initSmoothScroll() {
  if (typeof Lenis !== 'undefined' && typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }
}

function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;



  // Short pause so panels are visible, then split open
  const go = () => setTimeout(() => dismissPreloader(preloader), 600);

  if (document.readyState === 'complete') {
    go();
  } else {
    window.addEventListener('load', go, { once: true });
    // Fallback max 2.5s
    setTimeout(() => dismissPreloader(preloader), 2500);
  }
}


function dismissPreloader(preloader) {
  preloader.classList.add('exit');

  // Listen on right panel (last to start, so marks end of reveal)
  const rightPanel = document.getElementById('preloader-right');
  const onDone = () => {
    preloader.classList.add('done');
    document.body.classList.remove('is-loading');
    setTimeout(setHeroAnimations, 80);
    showCookieBannerDelayed();
  };

  if (rightPanel) {
    rightPanel.addEventListener('animationend', onDone, { once: true });
    setTimeout(onDone, 1000); // Fallback in case animation event fails
  } else {
    onDone();
  }

  // Fallback: force after 1.5s
  setTimeout(() => {
    preloader.classList.add('done');
    document.body.classList.remove('is-loading');
    setHeroAnimations();
  }, 1500);
}

function initLanguage() {
  applyLanguage(currentLang);

  const langDropdownToggle = document.getElementById('lang-dropdown-toggle');
  const langDropdown = document.getElementById('lang-dropdown');
  const langCurrentLabel = document.getElementById('lang-current-label');

  if (langDropdownToggle && langDropdown) {
    langDropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('open');
      langDropdownToggle.setAttribute('aria-expanded', langDropdown.classList.contains('open'));
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!langDropdown.contains(e.target)) {
        langDropdown.classList.remove('open');
        langDropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('[data-lang-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.langSwitch;
      localStorage.setItem('nortrade-lang', currentLang);
      applyLanguage(currentLang);
      
      if (langDropdown) {
        langDropdown.classList.remove('open');
        if (langDropdownToggle) langDropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

function applyLanguage(lang) {
  document.querySelectorAll('[data-fr][data-en]').forEach(el => {
    const text = el.dataset[lang];
    if (text === undefined) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else if (el.tagName === 'OPTION') {
      el.textContent = text;
    } else if (el.tagName === 'META') {
      el.setAttribute('content', text);
    } else {
      el.innerHTML = text;

      // If this is the text reveal element, we need to split it into words for the scroll animation
      if (el.classList.contains('reveal-text')) {
        setupRevealText(el);
      }
    }
  });

  const titleEl = document.querySelector('title');
  if (titleEl && titleEl.dataset[lang]) {
    document.title = titleEl.dataset[lang];
  }

  // Update Chatbot elements
  const chatbotInput = document.getElementById('chatbot-input');
  if (chatbotInput) {
    chatbotInput.placeholder = lang === 'fr' ? 'Écrire un message...' : 'Write a message...';
  }

  const chatbotStatusText = document.querySelector('.chatbot-status-text');
  if (chatbotStatusText) {
    chatbotStatusText.textContent = lang === 'fr' ? 'En ligne' : 'Online';
  }

  const chatbotName = document.querySelector('.chatbot-name');
  if (chatbotName) {
    chatbotName.textContent = lang === 'fr' ? 'Assistant NORTRADE' : 'NORTRADE Assistant';
  }

  const initialBotMsg = document.querySelector('#chatbot-messages .chat-msg.bot');
  if (initialBotMsg && !initialBotMsg.dataset.userResponded) {
    initialBotMsg.textContent = lang === 'fr' 
      ? 'Bonjour ! Je suis l\'assistant NORTRADE. Comment puis-je vous aider ?' 
      : 'Hi! I\'m the NORTRADE assistant. How can I help you?';
  }

  document.querySelectorAll('.quick-reply').forEach(btn => {
    const key = 'reply' + lang.charAt(0).toUpperCase() + lang.slice(1);
    if (btn.dataset[key]) btn.textContent = btn.dataset[key];
  });

  // Update Cookie Banner if present
  const cookieBanner = document.getElementById('cookie-banner');
  if (cookieBanner) {
    const p = cookieBanner.querySelector('p');
    if (p) {
      p.innerHTML = lang === 'fr'
        ? "Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. En continuant à naviguer sur ce site, vous acceptez notre <a href='privacy.html' style='text-decoration: underline; color: #ffffff;'>Politique de confidentialité</a>."
        : "We use cookies to improve your experience and analyze our traffic. By continuing to browse this site, you agree to our <a href='privacy.html' style='text-decoration: underline; color: #ffffff;'>Privacy Policy</a>.";
    }
    const btn = document.getElementById('accept-cookies');
    if (btn) {
      btn.textContent = lang === 'fr' ? "ACCEPTER" : "ACCEPT";
    }
  }

  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  const langCurrentLabel = document.getElementById('lang-current-label');
  const langInactiveBtn = document.getElementById('lang-inactive-btn');
  
  if (langCurrentLabel && langInactiveBtn) {
    langCurrentLabel.textContent = lang === 'fr' ? 'FR' : 'EN';
    
    const inactiveLang = lang === 'fr' ? 'en' : 'fr';
    langInactiveBtn.textContent = inactiveLang === 'fr' ? 'FR' : 'EN';
    langInactiveBtn.dataset.langSwitch = inactiveLang;
  }

  const footerFr = document.getElementById('footer-fr');
  const footerEn = document.getElementById('footer-en');
  if (footerFr) footerFr.classList.toggle('active', lang === 'fr');
  if (footerEn) footerEn.classList.toggle('active', lang === 'en');
}

let revealTimeline = null;

function setupRevealText(el) {
  if (typeof gsap === 'undefined') return;

  if (revealTimeline) revealTimeline.kill();

  const text = el.textContent || '';
  el.innerHTML = '';
  const words = text.split(' ');

  words.forEach(word => {
    const span = document.createElement('span');
    span.textContent = word + ' ';
    span.style.color = 'var(--color-grey-light)';
    span.style.transition = 'color 0.1s ease';
    el.appendChild(span);
  });

  const aboutSection = document.querySelector('.new-about-section');
  if (!aboutSection) return;

  revealTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: el, // Use the text block itself instead of the entire section
      start: 'top 85%',
      end: 'bottom 65%', // Finishes revealing before it scrolls past the middle
      scrub: 1.5, // Faster response to catch up before it scrolls away
    }
  });

  revealTimeline.to(el.querySelectorAll('span'), {
    color: 'var(--color-black)',
    stagger: 0.1,
    ease: 'none'
  });
}

function initNavigation() {
  const header = document.getElementById('site-header');
  if (!header) return;

  let ticking = false;

  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 60);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateHeader); ticking = true; }
  }, { passive: true });

  document.querySelectorAll('a[href^="#"], a[href*="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href) return;
      
      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return; // No hash, let normal navigation happen
      
      const hash = href.substring(hashIndex);
      if (hash === '#') return;

      const target = document.querySelector(hash);
      if (target) {
        e.preventDefault();

        // Add extra offset specifically for the inquiry form so it always lands precisely at the form
        const isContactForm = hash === '#contact-form';
        const navHeight = header ? header.offsetHeight : 80;
        const extraOffset = isContactForm ? 32 : 0; // 32px breathing room above form
        const scrollOffset = -(navHeight + extraOffset);

        // Use Lenis for smooth scroll if initialized
        if (typeof lenis !== 'undefined' && lenis) {
          setTimeout(() => {
            lenis.scrollTo(target, { offset: scrollOffset });
          }, 100);
        } else {
          setTimeout(() => {
            const top = target.getBoundingClientRect().top + window.scrollY + scrollOffset;
            window.scrollTo({ top, behavior: 'smooth' });
          }, 100);
        }

        closeMobileMenu();
      } else {
        // Target doesn't exist on current page, redirect to index.html with hash
        e.preventDefault();
        window.location.href = 'index.html' + hash;
      }
    });
  });
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.contains('open');
    open ? closeMobileMenu() : (mobileMenu.classList.add('open'), hamburger.classList.add('open'));
  });
}

function closeMobileMenu() {
  document.getElementById('hamburger')?.classList.remove('open');
  document.getElementById('mobile-menu')?.classList.remove('open');
}


function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // Stop observing once animated — no replay, no lag on scroll back
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  const selectors = [
    '.reveal-up',
    '.reveal-fade',
    '.reveal-clip',
    '.reveal-img',
    '.reveal-left',
    '.reveal-right',
    '.reveal-scale',
    '.stagger-children',
    '.process-card-slide'
  ];

  document.querySelectorAll(selectors.join(', ')).forEach(el => observer.observe(el));
}

function setHeroAnimations() {
  document.querySelectorAll('.hero .reveal-up').forEach((el, i) => {
    setTimeout(() => el.classList.add('in-view'), 300 + i * 170);
  });
}

function initHeroVideoPlaylist() {
  const videos = document.querySelectorAll('video[data-playlist]');
  if (!videos.length) return;

  videos.forEach(video => {
    try {
      const playlist = JSON.parse(video.dataset.playlist);
      if (!Array.isArray(playlist) || playlist.length < 2) return;

      let currentIndex = 0;
      const container = video.parentElement;
      if (container) container.style.backgroundColor = '#000'; // Prevent light flashes

      // Double buffering setup
      const video2 = video.cloneNode(true);
      video2.removeAttribute('id');
      video2.autoplay = false;
      video2.style.position = 'absolute';
      video2.style.top = '0';
      video2.style.left = '0';
      video2.style.opacity = '0';
      video2.style.transition = 'opacity 0.8s ease';
      video.style.transition = 'opacity 0.8s ease';
      
      if (video.nextSibling) {
        container.insertBefore(video2, video.nextSibling);
      } else {
        container.appendChild(video2);
      }

      let activeVideo = video;
      let nextVideo = video2;
      let isSwapping = false;

      // Preload next
      nextVideo.src = playlist[(currentIndex + 1) % playlist.length];
      nextVideo.load();

      const swapVideos = () => {
        currentIndex = (currentIndex + 1) % playlist.length;
        
        // Play next video and crossfade
        nextVideo.play().catch(e => console.error("Error playing next video:", e));
        nextVideo.style.opacity = '1';
        activeVideo.style.opacity = '0';
        
        // After transition, preload the *next* video into the hidden element
        setTimeout(() => {
          activeVideo.pause();
          activeVideo.src = playlist[(currentIndex + 1) % playlist.length];
          activeVideo.load();
          
          // Swap pointers
          const temp = activeVideo;
          activeVideo = nextVideo;
          nextVideo = temp;
          isSwapping = false;
        }, 850); // Slightly longer than 0.8s transition
      };

      const checkTime = () => {
        if (!isSwapping && activeVideo.duration && activeVideo.currentTime > 0) {
          // Trigger crossfade 0.8s before the end for a smooth merging effect
          if (activeVideo.duration - activeVideo.currentTime <= 0.8) {
            isSwapping = true;
            swapVideos();
          }
        }
      };

      video.addEventListener('timeupdate', checkTime);
      video2.addEventListener('timeupdate', checkTime);

    } catch (e) {
      console.error("Error parsing video playlist:", e);
    }
  });
}

function initParallax() {
  const parallaxWrap = document.querySelector('.parallax-wrap');
  if (!parallaxWrap || typeof gsap === 'undefined') return;

  const section = parallaxWrap.closest('.fullbleed-image');
  if (!section) return;

  gsap.fromTo(parallaxWrap,
    { yPercent: -10 },
    {
      yPercent: 10,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    }
  );
}

function initHeroFade() {
  const triggerSection = document.querySelector('.new-about-section');
  if (!triggerSection || typeof gsap === 'undefined') return;

  // Fade out the hero text immediately as the first content section scrolls up over the hero
  gsap.to('.hero-center, .hero-bottom, .hero-scroll-indicator', {
    opacity: 0,
    pointerEvents: 'none',
    ease: 'none',
    scrollTrigger: {
      trigger: triggerSection,
      start: 'top bottom', // Start fading right as the about section enters the bottom of the screen
      end: 'top center',   // Fully faded out by the time the about section reaches the middle
      scrub: true
    }
  });

  // Toggle hero visibility and pause video once the about section has fully slid up and covered the hero
  ScrollTrigger.create({
    trigger: triggerSection,
    start: 'top top',
    end: 'max',
    onToggle: self => {
      const hero = document.getElementById('hero');
      const heroVideo = document.getElementById('hero-video');
      if (hero) {
        if (self.isActive) {
          hero.style.visibility = 'hidden';
          if (heroVideo) heroVideo.pause();
        } else {
          hero.style.visibility = 'visible';
          if (heroVideo) heroVideo.play().catch(() => {});
        }
      }
    }
  });
}

function initImageLoading() {
  document.querySelectorAll('img').forEach(img => {
    const wrap = img.closest('.portfolio-img-wrap, .service-img-wrap, .about-media-wrap');
    if (wrap) wrap.classList.add('img-shimmer');

    if (img.complete && img.naturalWidth > 0) {
      img.closest('.img-shimmer')?.classList.add('loaded');
    } else {
      img.addEventListener('load', () => {
        img.closest('.img-shimmer')?.classList.add('loaded');
      });
    }
  });
}

function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('custom-cursor-dot');
  if (!cursor || !cursorDot) return;

  // Only on desktop with fine pointer
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mouseX = -100, mouseY = -100;
  let curX = -100, curY = -100;
  let raf;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot follows immediately
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';

    cursor.classList.add('active');
    cursorDot.classList.add('active');
  });

  document.addEventListener('mouseleave', () => {
    cursor.classList.remove('active');
    cursorDot.classList.remove('active');
  });

  // Smooth lag on outer ring
  function animateCursor() {
    curX += (mouseX - curX) * 0.12;
    curY += (mouseY - curY) * 0.12;
    cursor.style.left = curX + 'px';
    cursor.style.top = curY + 'px';
    raf = requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover state on interactive elements
  const hoverEls = document.querySelectorAll('a, button, .portfolio-item, .service-img-wrap, .why-card');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });
}

function initContactForm() {
  initMainContactForm();
  initFooterContactForm();
}

function initMainContactForm() {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const successMsg = document.getElementById('form-success-msg');
  const errorMsg = document.getElementById('form-error-msg');
  if (!form) return;

  const prenomEl = document.getElementById('prenom');
  const nomEl = document.getElementById('nom');
  const emailEl = document.getElementById('email');
  const messageEl = document.getElementById('message');

  const fields = [prenomEl, nomEl, emailEl, messageEl];

  // Helper to validate individual input state
  const validateField = (input) => {
    if (!input) return true;
    let isValid = true;
    
    if (input.type === 'email') {
      isValid = isValidEmail(input.value.trim());
    } else {
      isValid = input.value.trim() !== '';
    }

    if (!isValid) {
      input.setAttribute('aria-invalid', 'true');
      input.classList.add('user-invalid-fallback');
    } else {
      input.removeAttribute('aria-invalid');
      input.classList.remove('user-invalid-fallback');
    }
    return isValid;
  };

  // Timing: Blur triggers validation
  fields.forEach(field => {
    if (!field) return;
    
    field.addEventListener('blur', () => {
      setTimeout(() => {
        const isUserInvalid = field.matches?.(':user-invalid') || !validateField(field);
        if (isUserInvalid) {
          field.setAttribute('aria-invalid', 'true');
        } else {
          field.removeAttribute('aria-invalid');
        }
      }, 50);
    });

    // Timing: Input clears validation errors once corrected
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') {
        const isValid = field.type === 'email' ? isValidEmail(field.value.trim()) : field.value.trim() !== '';
        if (isValid) {
          field.removeAttribute('aria-invalid');
          field.classList.remove('user-invalid-fallback');
        }
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide previous response state banners
    if (successMsg) successMsg.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');

    // Run final validation on all fields
    let formIsValid = true;
    let firstInvalidField = null;

    fields.forEach(field => {
      if (!field) return;
      const isValid = validateField(field);
      if (!isValid) {
        formIsValid = false;
        if (!firstInvalidField) firstInvalidField = field;
      }
    });

    if (!formIsValid) {
      if (firstInvalidField) firstInvalidField.focus();
      if (errorMsg) {
        const errText = currentLang === 'fr' 
          ? "Veuillez corriger les erreurs dans le formulaire." 
          : "Please correct the errors in the form.";
        errorMsg.querySelector('p').textContent = errText;
        errorMsg.classList.remove('hidden');
      }
      return;
    }

    const prenom = prenomEl.value.trim();
    const nom = nomEl.value.trim();
    const name = `${prenom} ${nom}`.trim();
    const email = emailEl.value.trim();
    const companyEl = document.getElementById('company');
    const company = companyEl ? companyEl.value.trim() : '';
    const message = messageEl.value.trim();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = currentLang === 'fr' ? 'Envoi en cours...' : 'Sending...';
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, message, lang: currentLang })
      });

      if (response.ok) {
        if (successMsg) {
          successMsg.classList.remove('hidden');
        }
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = currentLang === 'fr' ? 'Envoyer le formulaire' : 'Submit your form';
        }
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.error(err);
      if (errorMsg) {
        const errText = currentLang === 'fr' 
          ? "Erreur lors de l'envoi du message. Veuillez réessayer plus tard." 
          : "Error sending message. Please try again later.";
        errorMsg.querySelector('p').textContent = errText;
        errorMsg.classList.remove('hidden');
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = currentLang === 'fr' ? 'Envoyer le formulaire' : 'Submit your form';
      }
    }
  });
}

function initFooterContactForm() {
  const form = document.getElementById('footer-contact-form');
  const submitBtn = document.getElementById('footer-submit-btn');
  const successMsg = document.getElementById('footer-success-msg');
  const errorMsg = document.getElementById('footer-error-msg');
  if (!form) return;

  const emailEl = document.getElementById('footer-email');
  const messageEl = document.getElementById('footer-message');

  const fields = [emailEl, messageEl];

  const validateField = (input) => {
    if (!input) return true;
    let isValid = true;
    
    if (input.type === 'email') {
      isValid = isValidEmail(input.value.trim());
    } else {
      isValid = input.value.trim() !== '';
    }

    if (!isValid) {
      input.setAttribute('aria-invalid', 'true');
      input.classList.add('user-invalid-fallback');
    } else {
      input.removeAttribute('aria-invalid');
      input.classList.remove('user-invalid-fallback');
    }
    return isValid;
  };

  fields.forEach(field => {
    if (!field) return;
    
    field.addEventListener('blur', () => {
      setTimeout(() => {
        const isUserInvalid = field.matches?.(':user-invalid') || !validateField(field);
        if (isUserInvalid) {
          field.setAttribute('aria-invalid', 'true');
        } else {
          field.removeAttribute('aria-invalid');
        }
      }, 50);
    });

    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') {
        const isValid = field.type === 'email' ? isValidEmail(field.value.trim()) : field.value.trim() !== '';
        if (isValid) {
          field.removeAttribute('aria-invalid');
          field.classList.remove('user-invalid-fallback');
        }
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (successMsg) successMsg.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');

    let formIsValid = true;
    let firstInvalidField = null;

    fields.forEach(field => {
      if (!field) return;
      const isValid = validateField(field);
      if (!isValid) {
        formIsValid = false;
        if (!firstInvalidField) firstInvalidField = field;
      }
    });

    if (!formIsValid) {
      if (firstInvalidField) firstInvalidField.focus();
      if (errorMsg) {
        const errText = currentLang === 'fr' 
          ? "Veuillez corriger les erreurs." 
          : "Please correct the errors.";
        errorMsg.querySelector('p').textContent = errText;
        errorMsg.classList.remove('hidden');
      }
      return;
    }

    const email = emailEl.value.trim();
    const message = messageEl.value.trim();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = currentLang === 'fr' ? 'ENVOI EN COURS...' : 'SENDING...';
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Footer Quick Contact', email, message, lang: currentLang })
      });

      if (response.ok) {
        form.classList.add('hidden');
        if (successMsg) {
          successMsg.classList.remove('hidden');
        }
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.error(err);
      if (errorMsg) {
        const errText = currentLang === 'fr' 
          ? "Erreur lors de l'envoi." 
          : "Error sending message.";
        errorMsg.querySelector('p').textContent = errText;
        errorMsg.classList.remove('hidden');
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = currentLang === 'fr' ? 'ENVOYER' : 'SEND MESSAGE';
      }
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function initChatbot() {
  const trigger = document.getElementById('chatbot-trigger');
  const panel = document.getElementById('chatbot-panel');
  const sendBtn = document.getElementById('chatbot-send-btn');
  const input = document.getElementById('chatbot-input');
  if (!trigger || !panel) return;

  trigger.addEventListener('click', () => {
    chatbotOpen = !chatbotOpen;
    trigger.classList.toggle('open', chatbotOpen);
    panel.classList.toggle('open', chatbotOpen);
  });

  const closeBtn = document.getElementById('chatbot-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chatbotOpen = false;
      trigger.classList.remove('open');
      panel.classList.remove('open');
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', () => sendMessage());
  if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
}

const chatbotResponses = {
  fr: {
    services: 'Nous accompagnons nos clients à travers 4 expertises clés : Rendus architecturaux photoréalistes, Animations & cinématiques, Visualisation d\'intérieurs, et Visites virtuelles immersives. Chaque accompagnement est élaboré sur mesure.',
    devis: 'Pour étudier votre projet et obtenir une proposition sur mesure, remplissez le formulaire de contact, appelez le +41 78 206 59 42 ou écrivez-nous à contact@nortrade.ch. Nous vous répondrons sous 24h.',
    delais: 'Rendu d\'architecture : 3-5 jours. Animation : 1-2 semaines. Accompagnement global : sur devis. Nous garantissons le respect strict des calendriers convenus.',
    default: 'Merci pour votre message. Pour tout accompagnement stratégique, appelez le +41 78 206 59 42 ou contactez-nous à contact@nortrade.ch.'
  },
  en: {
    services: 'We support our clients through 4 core strategic capabilities: Photorealistic architectural renders, Cinematic animations, Interior visual strategy, and Immersive virtual tours. Each engagement is fully tailored.',
    devis: 'To discuss your project and receive a tailored proposal, fill in the contact form, call +41 78 206 59 42 or email contact@nortrade.ch. We reply within 24 hours.',
    delais: 'Architectural render: 3-5 days. Animation: 1-2 weeks. Full strategic engagement: on proposal. We guarantee strict adherence to agreed project timelines.',
    default: 'Thank you for your message. Contact us at +41 78 206 59 42, contact@nortrade.ch or via the contact form for any specific inquiry.'
  }
};

function sendMessage() {
  const input = document.getElementById('chatbot-input');
  const quickReplies = document.getElementById('quick-replies');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  if (quickReplies) quickReplies.style.display = 'none';
  addChatMessage(text, 'user');
  input.value = '';

  setTimeout(() => addChatMessage(getBotResponse(text), 'bot'), 750);
}

function sendQuickReply(btn) {
  const text = btn.textContent.trim();
  document.getElementById('quick-replies')?.style.setProperty('display', 'none');
  addChatMessage(text, 'user');
  setTimeout(() => addChatMessage(getBotResponse(text), 'bot'), 700);
}

function addChatMessage(text, type) {
  const messages = document.getElementById('chatbot-messages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.className = `chat-msg ${type}`;
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function getBotResponse(text) {
  const lower = text.toLowerCase();
  const r = chatbotResponses[currentLang];
  if (lower.includes('service') || lower.includes('offre') || lower.includes('offer')) return r.services;
  if (lower.includes('devis') || lower.includes('prix') || lower.includes('quote') || lower.includes('cost')) return r.devis;
  if (lower.includes('delai') || lower.includes('délai') || lower.includes('temps') || lower.includes('time') || lower.includes('delivery')) return r.delais;
  return r.default;
}

(function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const raw = el.textContent;
      const num = parseInt(raw.replace(/[^0-9]/g, ''));
      const suffix = raw.replace(/[0-9]/g, '');
      let cur = 0;
      const step = num / 55;
      const timer = setInterval(() => {
        cur = Math.min(cur + step, num);
        el.textContent = Math.round(cur) + suffix;
        if (cur >= num) clearInterval(timer);
      }, 28);
      observer.unobserve(el);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
})();

function initServicesScroll() {
  const section = document.querySelector('.horizontal-services-section');
  const imgSlides = gsap.utils.toArray('.stack-slide');
  const textSlides = gsap.utils.toArray('.fade-slide');
  const header = document.getElementById('site-header');

  if (!section || imgSlides.length === 0 || textSlides.length === 0 || typeof gsap === 'undefined') return;

  // Toggle header transparency when overlapping the image window
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom top',
    onToggle: self => {
      if (header) {
        header.classList.toggle('over-services', self.isActive);
      }
    }
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom', // Scrub through the entire 600vh height
      scrub: 1, // Smooth scrubbing via Lenis
      snap: {
        snapTo: "labels", // Snap to the closest label defined in the timeline
        duration: { min: 0.2, max: 0.6 },
        delay: 0.1, // Wait 0.1s after the user stops scrolling before snapping
        ease: "power1.inOut"
      }
    }
  });

  // GSAP animation logic for slides
  imgSlides.forEach((slide, index) => {
    // Make sure all text slides start faded out except the first one
    if (index === 0) {
      gsap.set(textSlides[index], { opacity: 1, y: 0, pointerEvents: 'auto' });
      gsap.set(slide, { opacity: 1, scale: 1, yPercent: 0 }); // First image fully visible
      tl.addLabel(`slide-${index}`); // Initial slide label
      return;
    }

    // Animate text crossfade (smooth fade in and out animation)
    tl.to(textSlides[index - 1], { opacity: 0, y: -15, pointerEvents: 'none', duration: 0.5 }, `+=${0.5}`); // Pause before transitioning
    tl.fromTo(textSlides[index],
      { opacity: 0, y: 15, pointerEvents: 'none' },
      { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.5 },
      "<"
    );

    // Explicitly place the new slide below the visible area
    gsap.set(slide, { yPercent: 100, opacity: 1, scale: 1 });

    // Previous image slides up slightly (parallax effect) and fades out a bit for depth
    tl.to(imgSlides[index - 1], { yPercent: -20, opacity: 0, duration: 1, ease: 'power1.inOut' }, "<");

    // New image slides smoothly up into view
    tl.to(slide,
      { yPercent: 0, duration: 1, ease: 'power1.inOut' },
      "<" // Starts at the same time as the text transition
    );

    // Add a label at the exact point this slide's transition finishes
    tl.addLabel(`slide-${index}`);
  });

  // Add a dummy tween to the end of the timeline so the last slide holds on screen
  // for a while before the user scrolls past the section
  tl.to({}, { duration: 2 });
}

function initAboutScroll() {
  const aboutSection = document.querySelector('.new-about-section');
  const revealText = document.querySelector('.reveal-text');

  if (!aboutSection || !revealText || typeof gsap === 'undefined') return;

  gsap.fromTo(revealText,
    { '--scroll-progress': 0 },
    {
      '--scroll-progress': 1,
      ease: 'none',
      scrollTrigger: {
        trigger: revealText,
        start: 'top 85%',   // Start earlier
        end: 'bottom 45%',  // End later, creating a longer scroll distance
        scrub: 2,           // Very smooth, interpolated scrubbing
      }
    }
  );
}

function initEdgeButtonsVisibility() {
  const edgeButtons = document.querySelector('.right-edge-buttons');
  if (!edgeButtons) return;

  const updateVisibility = () => {
    // Hide buttons almost immediately when scrolling starts (e.g., after 50px)
    const inHero = window.scrollY < 50;

    // Determine if we are at the bottom of the page (footer)
    const docHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    const scrollBottom = window.scrollY + window.innerHeight;
    const inFooter = (docHeight - scrollBottom) < 800; // ~footer height

    if (inHero || inFooter) {
      edgeButtons.classList.remove('hidden');
    } else {
      edgeButtons.classList.add('hidden');
    }
  };

  // Check initially
  updateVisibility();

  // Check on scroll with requestAnimationFrame for performance
  window.addEventListener('scroll', () => {
    if (!window._edgeBtnTicking) {
      window.requestAnimationFrame(() => {
        updateVisibility();
        window._edgeBtnTicking = false;
      });
      window._edgeBtnTicking = true;
    }
  }, { passive: true });
}

// 
// COOKIE CONSENT BANNER
// 
function initCookieBanner() {
  const cookieName = 'nortrade_cookie_consent';
  if (localStorage.getItem(cookieName)) return;

  // Let translations load first (small delay)
  setTimeout(() => {
    const isFr = document.documentElement.getAttribute('data-lang') !== 'en';
    
    const text = isFr 
      ? "Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. En continuant à naviguer sur ce site, vous acceptez notre <a href='privacy.html' style='text-decoration: underline; color: #ffffff;'>Politique de confidentialité</a>."
      : "We use cookies to improve your experience and analyze our traffic. By continuing to browse this site, you agree to our <a href='privacy.html' style='text-decoration: underline; color: #ffffff;'>Privacy Policy</a>.";
    
    const btnText = isFr ? "ACCEPTER" : "ACCEPT";

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div style="flex: 1; padding-right: 1.5rem; margin-bottom: 0;">
        <p style="margin: 0; font-family: var(--font-sans); font-size: 0.8rem; font-weight: 300; line-height: 1.5; color: var(--color-white);">${text}</p>
      </div>
      <button id="accept-cookies" aria-label="Accept Cookies" style="background: transparent; color: #ffffff; border: 1px solid #ffffff; padding: 0.7rem 1.4rem; font-family: var(--font-sans); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; border-radius: 2px; transition: all 0.3s; white-space: nowrap;">${btnText}</button>
    `;

    Object.assign(banner.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%) translateY(100px)',
      width: '90%',
      maxWidth: '600px',
      background: 'rgba(26, 26, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      webkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '4px',
      padding: '1.2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: '9999',
      opacity: '0',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
    });

    // Mobile specific layout
    if (window.innerWidth < 600) {
      banner.style.flexDirection = 'column';
      banner.style.alignItems = 'flex-start';
      banner.children[0].style.paddingRight = '0';
      banner.children[0].style.marginBottom = '1rem';
      banner.children[1].style.width = '100%';
    }

    document.body.appendChild(banner);

    // Animate in
    setTimeout(() => {
      banner.style.transform = 'translateX(-50%) translateY(0)';
      banner.style.opacity = '1';
    }, 100);

    // Accept logic
    const acceptBtn = document.getElementById('accept-cookies');
    
    acceptBtn.addEventListener('mouseover', () => {
      acceptBtn.style.background = '#fff';
    });
    acceptBtn.addEventListener('mouseout', () => {
      acceptBtn.style.background = 'var(--color-gold)';
    });
    
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem(cookieName, 'accepted');
      banner.style.transform = 'translateX(-50%) translateY(100px)';
      banner.style.opacity = '0';
      setTimeout(() => {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 600);
    });
  }, 2000);
}

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Auto-close other items
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-answer')?.classList.remove('open');
        }
      });

      if (isActive) {
        item.classList.remove('active');
        question.setAttribute('aria-expanded', 'false');
        answer?.classList.remove('open');
      } else {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        answer?.classList.add('open');
      }
    });
  });
}
