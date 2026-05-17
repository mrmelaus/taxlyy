(function () {
    'use strict';

    // ========================================
    // NAVBAR SCROLL EFFECT
    // ========================================
    const navbar = document.getElementById('navbar');

    function updateNav() {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    // ========================================
    // REVEAL ON SCROLL ANIMATION
    // ========================================
    const revealEls = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        revealEls.forEach((el) => observer.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('visible'));
    }

    // ========================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = parseInt(
                    getComputedStyle(document.documentElement)
                        .getPropertyValue('--nav-height'),
                    10
                ) || 64;
                const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ========================================
    // FAQ ACCORDION - EXPAND/COLLAPSE
    // ========================================
    const faqItems = document.querySelectorAll('.faq-item');

    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const toggle = item.querySelector('.faq-toggle');
            
            const toggleItem = () => {
                // Optional: Close other items (uncomment for single-open mode)
                 faqItems.forEach(otherItem => {
                     if (otherItem !== item && otherItem.classList.contains('active')) {
                         otherItem.classList.remove('active');
                     }
                 });
                
                item.classList.toggle('active');
            };
            
            if (question) {
                question.addEventListener('click', toggleItem);
            }
            
            if (toggle) {
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleItem();
                });
            }
        });
    }

    // TESTIMONIAL AUTO-RUNNING MARQUEE
    // ========================================
    const marqueeTrack = document.getElementById('marqueeTrack');
    const toggleBtn = document.getElementById('toggleMarqueeBtn');
    const pausePlayIcon = document.getElementById('pausePlayIcon');

    if (marqueeTrack) {
        // Duplicate cards for seamless infinite loop
        const originalCards = Array.from(marqueeTrack.children);
        originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            marqueeTrack.appendChild(clone);
        });

        // After duplication, animate by exactly half the total track width
        function setMarqueeAnimation() {
            const totalWidth = marqueeTrack.scrollWidth;
            const halfWidth = totalWidth / 2;
            
            // Inject/update the keyframe dynamically
            let styleEl = document.getElementById('marquee-keyframe');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'marquee-keyframe';
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = `
                @keyframes scrollMarquee {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-${halfWidth}px); }
                }
            `;
        }

        setMarqueeAnimation();

        // Recalculate on resize (e.g. card width changes at breakpoints)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setMarqueeAnimation, 150);
        });
    }

    // Toggle pause/play if button exists
    if (marqueeTrack && toggleBtn) {
        let isPlaying = true;

        toggleBtn.addEventListener('click', () => {
            if (isPlaying) {
                marqueeTrack.style.animationPlayState = 'paused';
                toggleBtn.innerHTML = '<span id="pausePlayIcon">▶</span> Play';
            } else {
                marqueeTrack.style.animationPlayState = 'running';
                toggleBtn.innerHTML = '<span id="pausePlayIcon">⏸</span> Pause';
            }
            isPlaying = !isPlaying;
        });
    }

    // ========================================
    // DEADLINE COUNTDOWN
    // ========================================
    function updateDeadlineCountdown() {
        const badge = document.querySelector('.hero-badge');
        if (!badge) return;

        const now = new Date();

        const year        = now.getFullYear();
        const seasonStart = new Date(year, 6, 1);               // 1 Jul
        const seasonEnd   = new Date(year, 9, 31, 23, 59, 59);  // 31 Oct
        const fyStart     = year - 1;
        const fyEnd       = String(year).slice(-2);

        if (now >= seasonStart && now <= seasonEnd) {

            function tick(referenceDate) {
                const diff    = seasonEnd - referenceDate;

                if (diff <= 0) {
                    badge.textContent = `${fyStart}–${fyEnd} lodgement period has closed · Deadline was 31 October ${year}`;
                    return;
                }

                const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (days > 30) {
                    badge.textContent = `📅 ${fyStart}–${fyEnd} lodgement closes 31 Oct ${year} · ${days} days left — get your tax estimate ready`;
                } else if (days > 7) {
                    badge.textContent = `⚠️ ${fyStart}–${fyEnd} ATO lodgement closes in ${days}d ${hours}h ${minutes}m — get your report before it's too late`;
                } else {
                    badge.textContent = `🚨 ${fyStart}–${fyEnd} ATO deadline in ${days}d ${hours}h ${minutes}m ${seconds}s — get your tax estimate now`;
                }
            }

            tick(now);
            setInterval(() => tick(new Date()), 1000);

        } else {
            // OUT OF SEASON — inform user of the window, no urgency
            badge.textContent = `📋 ATO tax lodgement opens 1 July · Deadline 31 October each year`;
        }
    }

    updateDeadlineCountdown();


})();