'use strict';

/* ── STATE ─────────────────────────────────────────────── */
let currentLang = localStorage.getItem('nortrade-lang') || 'fr';
let chatbotOpen = false;
let lenis;

async function loadComponents() {
  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch('components/header.html'),
      fetch('components/footer.html')
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

/* ── DOM READY ──────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════
   PRELOADER  (floffice-inspired)
══════════════════════════════════════════════════════════ */
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
    showCookieBannerDelayed();
  }, 1500);
}


function showCookieBannerDelayed() {
  // Show cookie banner 1.5s after preloader, if not already consented
  if (!localStorage.getItem('nortrade-cookie-choice')) {
    setTimeout(() => {
      const banner = document.getElementById('cookie-banner');
      if (banner) banner.classList.add('visible');
    }, 1500);
  }
}

/* ══════════════════════════════════════════════════════════
   COOKIE CONSENT BANNER
══════════════════════════════════════════════════════════ */
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const accept = document.getElementById('cookie-accept');
  const deny = document.getElementById('cookie-deny');

  if (!banner) return;

  // If already chosen, never show again
  if (localStorage.getItem('nortrade-cookie-choice')) {
    banner.style.display = 'none';
    return;
  }

  function closeBanner(choice) {
    localStorage.setItem('nortrade-cookie-choice', choice);
    banner.classList.remove('visible');
    setTimeout(() => { banner.style.display = 'none'; }, 700);

    if (choice === 'accept') {
      // Analytics / tracking cookies could be enabled here
      console.log('[NORTRADE] Cookies accepted.');
    } else {
      // Only essential cookies
      console.log('[NORTRADE] Only essential cookies active.');
    }
  }

  if (accept) accept.addEventListener('click', () => closeBanner('accept'));
  if (deny) deny.addEventListener('click', () => closeBanner('deny'));
}

/* ══════════════════════════════════════════════════════════
   LANGUAGE SYSTEM
══════════════════════════════════════════════════════════ */
function initLanguage() {
  applyLanguage(currentLang);

  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'fr' ? 'en' : 'fr';
      localStorage.setItem('nortrade-lang', currentLang);
      applyLanguage(currentLang);
    });
  }

  document.querySelectorAll('[data-lang-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.langSwitch;
      localStorage.setItem('nortrade-lang', currentLang);
      applyLanguage(currentLang);
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
    } else {
      el.innerHTML = text;

      // If this is the text reveal element, we need to split it into words for the scroll animation
      if (el.classList.contains('reveal-text')) {
        setupRevealText(el);
      }
    }
  });

  const chatbotInput = document.getElementById('chatbot-input');
  if (chatbotInput) {
    chatbotInput.placeholder = lang === 'fr' ? 'Ecrire un message...' : 'Write a message...';
  }

  document.querySelectorAll('.quick-reply').forEach(btn => {
    const key = 'reply' + lang.charAt(0).toUpperCase() + lang.slice(1);
    if (btn.dataset[key]) btn.textContent = btn.dataset[key];
  });

  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  const frBtn = document.getElementById('lang-fr-btn');
  const enBtn = document.getElementById('lang-en-btn');
  if (frBtn) frBtn.classList.toggle('active', lang === 'fr');
  if (enBtn) enBtn.classList.toggle('active', lang === 'en');

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
      trigger: aboutSection,
      start: 'top 65%',
      end: 'top 15%',
      scrub: 1,
    }
  });

  revealTimeline.to(el.querySelectorAll('span'), {
    color: 'var(--color-black)',
    stagger: 0.1,
    ease: 'none'
  });
}

/* ══════════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════════ */
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

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();

      // Use Lenis for smooth scroll if initialized
      if (typeof lenis !== 'undefined' && lenis) {
        lenis.scrollTo(target, { offset: -header.offsetHeight });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }

      closeMobileMenu();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   MOBILE MENU
══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
   SCROLL REVEAL  (Intersection Observer)
   Handles: .reveal-up, .reveal-fade, .reveal-clip,
            .reveal-img, .stagger-children
══════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  const selectors = [
    '.reveal-up',
    '.reveal-fade',
    '.reveal-clip',
    '.reveal-img',
    '.stagger-children'
  ];

  document.querySelectorAll(selectors.join(', ')).forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════════════════════
   HERO ANIMATIONS (triggered after preloader)
══════════════════════════════════════════════════════════ */
function setHeroAnimations() {
  document.querySelectorAll('.hero .reveal-up').forEach((el, i) => {
    setTimeout(() => el.classList.add('in-view'), 300 + i * 170);
  });
}

/* ══════════════════════════════════════════════════════════
   HERO VIDEO PLAYLIST
══════════════════════════════════════════════════════════ */
function initHeroVideoPlaylist() {
  const videos = document.querySelectorAll('video[data-playlist]');
  if (!videos.length) return;

  videos.forEach(video => {
    try {
      const playlist = JSON.parse(video.dataset.playlist);
      if (!Array.isArray(playlist) || playlist.length < 2) return;

      let currentIndex = 0;

      video.addEventListener('ended', () => {
        currentIndex = (currentIndex + 1) % playlist.length;
        video.src = playlist[currentIndex];
        video.play().catch(e => console.error("Error playing next video:", e));
      });
    } catch (e) {
      console.error("Error parsing video playlist:", e);
    }
  });
}

/* ══════════════════════════════════════════════════════════
   PARALLAX (GSAP)
══════════════════════════════════════════════════════════ */
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
  gsap.to('.hero-center, .hero-bottom', {
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
}

/* ══════════════════════════════════════════════════════════
   IMAGE LOADING — shimmer → reveal
══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const successMsg = document.getElementById('form-success-msg');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message || !isValidEmail(email)) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      const t = submitBtn.querySelector('.btn-text');
      if (t) t.textContent = currentLang === 'fr' ? 'Envoi en cours...' : 'Sending...';
    }

    setTimeout(() => {
      form.style.display = 'none';
      if (successMsg) successMsg.classList.remove('hidden');
    }, 1200);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ══════════════════════════════════════════════════════════
   CHATBOT
══════════════════════════════════════════════════════════ */
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
    services: 'Nous proposons 4 services : Rendus 3D architecturaux, Animations & cinematiques, Visualisation d\'interieurs, et Visites virtuelles. Chaque service est personnalise selon vos besoins.',
    devis: 'Pour un devis, remplissez le formulaire de contact ou ecrivez-nous a contact@nortrade.ch. Nous vous repondrons sous 24h.',
    delais: 'Rendu simple : 3-5 jours. Animation : 1-2 semaines. Projet complet : sur devis. Nous respectons toujours les deadlines convenues.',
    default: 'Merci pour votre message. Pour toute demande, contactez-nous a contact@nortrade.ch ou via le formulaire de contact.'
  },
  en: {
    services: 'We offer 4 services: Architectural 3D Renders, Animations & Cinematics, Interior Visualisation, and Virtual Tours. Each is fully personalised.',
    devis: 'To get a quote, fill in the contact form or email contact@nortrade.ch. We reply within 24 hours.',
    delais: 'Simple render: 3-5 days. Animation: 1-2 weeks. Full project: on quote. We always meet agreed deadlines.',
    default: 'Thank you for your message. Contact us at contact@nortrade.ch or via the contact form for any specific request.'
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
  if (lower.includes('delai') || lower.includes('temps') || lower.includes('time') || lower.includes('delivery')) return r.delais;
  return r.default;
}

/* ══════════════════════════════════════════════════════════
   COUNTER ANIMATION
══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
   HORIZONTAL SERVICES SCROLL (GSAP)
══════════════════════════════════════════════════════════ */
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
    }
  });

  // GSAP animation logic for slides
  imgSlides.forEach((slide, index) => {
    // Make sure all text slides start faded out except the first one
    if (index === 0) {
      gsap.set(textSlides[index], { opacity: 1, y: 0, pointerEvents: 'auto' });
      gsap.set(slide, { opacity: 1, scale: 1, yPercent: 0 }); // First image fully visible
      return;
    }

    // Animate text crossfade
    tl.to(textSlides[index - 1], { opacity: 0, y: -30, pointerEvents: 'none', duration: 0.5 }, `+=${0.5}`); // Pause before transitioning
    tl.fromTo(textSlides[index],
      { opacity: 0, y: 30, pointerEvents: 'none' },
      { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.5 },
      "<"
    );

    // Explicitly hide image slide initially before animating it in
    gsap.set(slide, { opacity: 0, scale: 1.05 });

    // Fade out and scale down previous image
    tl.to(imgSlides[index - 1], { opacity: 0, scale: 0.95, duration: 1, ease: 'power2.inOut' }, "<");

    // Fade in and scale normal for new image
    tl.fromTo(slide,
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 1, ease: 'power2.inOut' },
      "<" // Starts at the same time as the text transition
    );
  });

  // Add a dummy tween to the end of the timeline so the last slide holds on screen
  // for a while before the user scrolls past the section
  tl.to({}, { duration: 2 });
}

/* ══════════════════════════════════════════════════════════
   ABOUT SECTION SCROLL (GSAP)
══════════════════════════════════════════════════════════ */
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
        trigger: aboutSection,
        start: 'top 75%',
        end: 'top 25%',
        scrub: 1, // Smooth scrubbing
      }
    }
  );
}

/* ══════════════════════════════════════════════════════════
   EDGE BUTTONS VISIBILITY
══════════════════════════════════════════════════════════ */
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

// ══════════════════════════════════════════════════════════
// COOKIE CONSENT BANNER
// ══════════════════════════════════════════════════════════
function initCookieBanner() {
  const cookieName = 'nortrade_cookie_consent';
  if (localStorage.getItem(cookieName)) return;

  // Let translations load first (small delay)
  setTimeout(() => {
    const isFr = document.documentElement.getAttribute('data-lang') !== 'en';
    
    const text = isFr 
      ? "Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. En continuant à naviguer sur ce site, vous acceptez notre <a href='privacy.html' style='text-decoration: underline; color: var(--color-gold);'>Politique de confidentialité</a>."
      : "We use cookies to improve your experience and analyze our traffic. By continuing to browse this site, you agree to our <a href='privacy.html' style='text-decoration: underline; color: var(--color-gold);'>Privacy Policy</a>.";
    
    const btnText = isFr ? "ACCEPTER" : "ACCEPT";

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div style="flex: 1; padding-right: 1.5rem; margin-bottom: 0;">
        <p style="margin: 0; font-family: var(--font-sans); font-size: 0.8rem; font-weight: 300; line-height: 1.5; color: var(--color-white);">${text}</p>
      </div>
      <button id="accept-cookies" aria-label="Accept Cookies" style="background: var(--color-gold); color: #000; border: none; padding: 0.8rem 1.5rem; font-family: var(--font-sans); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; border-radius: 2px; transition: all 0.3s; white-space: nowrap;">${btnText}</button>
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

// Ensure it runs after main loads
window.addEventListener('load', initCookieBanner);
