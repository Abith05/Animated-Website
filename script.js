gsap.registerPlugin(ScrollTrigger);

// 1. Lenis Smooth Scrolling Initialization
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Sync ScrollTrigger with Lenis
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0, 0);

// Disable scrolling initially while preloading
lenis.stop();


// 2. Custom Magnetic Cursor
const cursor = document.querySelector('.cursor');
const magnetics = document.querySelectorAll('.magnetic');
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (!isMobile) {
    window.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            ease: "power2.out"
        });
    });

    magnetics.forEach((mag) => {
        mag.addEventListener('mouseenter', () => {
            cursor.classList.add('hover-magnetic');
        });
        mag.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover-magnetic');
        });
    });
} else {
    if (cursor) cursor.style.display = 'none';
}


// 3. Sound Toggle (Engine Purr)
const soundToggle = document.getElementById('sound-toggle');
const engineSound = document.getElementById('engine-sound');
engineSound.volume = 0.5;

// Modern browsers block autoplay until user interacts. 
const startAudioOnInteract = () => {
    engineSound.play().then(() => {
        soundToggle.textContent = 'SOUND: ON';
        soundToggle.classList.add('active');

        window.removeEventListener('click', startAudioOnInteract);
        window.removeEventListener('scroll', startAudioOnInteract);
        window.removeEventListener('keydown', startAudioOnInteract);
        window.removeEventListener('touchstart', startAudioOnInteract);
    }).catch(() => {
    });
};

window.addEventListener('click', startAudioOnInteract);
window.addEventListener('scroll', startAudioOnInteract);
window.addEventListener('keydown', startAudioOnInteract);
window.addEventListener('touchstart', startAudioOnInteract);

// Force autoplay attempt
engineSound.play().then(() => {
    soundToggle.textContent = 'SOUND: ON';
    soundToggle.classList.add('active');
}).catch(e => {
    console.log("Autoplay forcefully blocked by browser setting.");
});

soundToggle.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent triggering the interaction listener
    if (engineSound.paused) {
        engineSound.play();
        soundToggle.textContent = 'SOUND: ON';
        soundToggle.classList.add('active');
    } else {
        engineSound.pause();
        soundToggle.textContent = 'SOUND: OFF';
        soundToggle.classList.remove('active');
        // If user manually turns it off, don't auto-start it again
        window.removeEventListener('click', startAudioOnInteract);
        window.removeEventListener('scroll', startAudioOnInteract);
        window.removeEventListener('keydown', startAudioOnInteract);
        window.removeEventListener('touchstart', startAudioOnInteract);
    }
});


// 4. Hero Canvas Preloader & Sequence
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const frameCount = 240;
const currentFrame = index => (
    `./assets/herosection/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`
);

const images = [];
const imageSeq = { frame: 0 };
let loadedImages = 0;
const progressText = document.querySelector('.progress');
const preloader = document.getElementById('preloader');

// Load Images
for (let i = 0; i < frameCount; i++) {
    const img = new Image();

    const handleLoad = () => {
        loadedImages++;

        // Update loading text
        const progress = Math.round((loadedImages / frameCount) * 100);
        progressText.textContent = `${progress}%`;

        // When all frames are loaded
        if (loadedImages === frameCount) {
            initCanvas();
        }
    };

    img.onload = handleLoad;

    img.onerror = () => {
        console.error(`Failed to load frame: ${img.src}`);
        handleLoad(); // Continue even if one frame fails, so it doesn't get stuck permanently
    };

    img.src = currentFrame(i);
    images.push(img);
}

function initCanvas() {
    // Initial draw
    render();

    const enterBtn = document.querySelector('.enter-btn');

    // Hide progress text and show the enter button
    progressText.style.display = 'none';
    enterBtn.style.display = 'inline-block';

    enterBtn.addEventListener('click', () => {
        // Play engine sound immediately upon interaction
        engineSound.play().catch(e => console.log(e));
        soundToggle.textContent = 'SOUND: ON';
        soundToggle.classList.add('active');

        // Animate preloader out
        gsap.to(preloader, {
            opacity: 0,
            duration: 1,
            ease: "power2.inOut",
            onComplete: () => {
                preloader.style.display = "none";
                // Start lenis smooth scrolling
                lenis.start();
                // Force GSAP to recalculate everything once preloader is gone
                ScrollTrigger.refresh();
            }
        });
    });
}

// Force scroll to top on page refresh for a clean experience
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

// Parallax target positions
let targetX = 0;
let targetY = 0;

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const img = images[imageSeq.frame];
    if (!img) return;

    // Calculate scale
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    // Add a 5% buffer scale so the image covers the screen even when shifted by parallax
    const finalScale = scale * 1.05;

    const x = (canvas.width / 2) - (img.width / 2) * finalScale + targetX;
    const y = (canvas.height / 2) - (img.height / 2) * finalScale + targetY;

    context.drawImage(img, x, y, img.width * finalScale, img.height * finalScale);
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
});

// Canvas Mouse Parallax Logic
window.addEventListener('mousemove', (e) => {
    // Get mouse position relative to center of screen (-0.5 to 0.5)
    const mouseX = (e.clientX / window.innerWidth) - 0.5;
    const mouseY = (e.clientY / window.innerHeight) - 0.5;

    // Smoothly interpolate the target coordinates
    gsap.to(window, {
        duration: 1,
        ease: "power2.out",
        onUpdate: function () {
            // Shift image by max 50 pixels
            targetX = mouseX * -50;
            targetY = mouseY * -50;
            render();
        }
    });
});


// 5. GSAP Scroll Animations

// Canvas Frame Scrubbing
gsap.to(imageSeq, {
    frame: frameCount - 1,
    snap: "frame",
    ease: "none",
    scrollTrigger: {
        trigger: ".hero-sequence",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5
    },
    onUpdate: render
});

// Feature Text Timeline
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".hero-sequence",
        start: "top top",
        end: "bottom bottom",
        scrub: 1
    }
});

tl.to(".feature-1", { opacity: 1, y: -20, duration: 1 })
    .to(".feature-1", { opacity: 0, y: -40, duration: 1 }, "+=0.5")
    .to(".feature-2", { opacity: 1, y: -20, duration: 1 })
    .to(".feature-2", { opacity: 0, y: -40, duration: 1 }, "+=0.5")
    .to(".feature-3", { opacity: 1, y: -20, duration: 1 })
    .to(".feature-3", { opacity: 0, y: -40, duration: 1 }, "+=0.5");

// Apple-Style Text Reveal
const splitText = new SplitType('.reveal-text', { types: 'words' });
gsap.fromTo(splitText.words,
    { color: "rgba(255, 255, 255, 0.1)" },
    {
        color: "#f5f5f7",
        stagger: 0.1,
        scrollTrigger: {
            trigger: ".details-section",
            start: "top 80%",
            end: "bottom 60%",
            scrub: 1,
        }
    }
);

// Iconic 800 Overview Animations
gsap.from(".massive-numeral", {
    scrollTrigger: { trigger: ".iconic-overview", start: "top 90%", end: "center center", scrub: 1 },
    y: 150, opacity: 0, scale: 0.8
});
gsap.from(".iconic-text-block", {
    scrollTrigger: { trigger: ".iconic-overview", start: "top 70%", end: "center center", scrub: 1 },
    x: 50, opacity: 0
});
gsap.from(".aero-widget-anim", {
    scrollTrigger: { trigger: ".iconic-overview", start: "top 50%", end: "center center", scrub: 1 },
    y: 100, opacity: 0, rotationX: 20
});

// Exterior Cards Staggered Reveal
gsap.from(".exterior-header h2", {
    scrollTrigger: { trigger: ".exterior-performance", start: "top 80%", end: "top 50%", scrub: 1 },
    y: 50, opacity: 0
});
gsap.from(".card-anim", {
    scrollTrigger: { trigger: ".exterior-performance", start: "top 60%", end: "center center", scrub: 1 },
    y: 150, opacity: 0, stagger: 0.2
});
gsap.utils.toArray('.card-img-wrapper img').forEach(img => {
    gsap.to(img, {
        scrollTrigger: { trigger: img.parentElement.parentElement, start: "top bottom", end: "bottom top", scrub: 1 },
        scale: 1.15
    });
});

// Cockpit Section Parallax
gsap.to(".cockpit-img", {
    scrollTrigger: { trigger: ".cockpit-section", start: "top top", end: "bottom top", scrub: 1 },
    scale: 1, opacity: 0.4
});
gsap.from(".cockpit-text h2", {
    scrollTrigger: { trigger: ".cockpit-section", start: "top 30%", end: "top top", scrub: 1 },
    x: -100, opacity: 0
});
gsap.from(".cockpit-text p", {
    scrollTrigger: { trigger: ".cockpit-section", start: "top 20%", end: "top -10%", scrub: 1 },
    y: 50, opacity: 0
});

// --- 8. Performance Matrix Counters ---
const counters = document.querySelectorAll('.counter');
const belowSection = document.querySelector('.horizontal-gallery-container');

counters.forEach(counter => {
    ScrollTrigger.create({
        trigger: ".performance-matrix",
        start: "top 70%",
        once: true,
        onEnter: () => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const duration = 2.5;

            // If this is the Top Speed counter, shake the section below until it reaches 350
            if (target === 350) {
                if (belowSection) {
                    belowSection.classList.add('speed-shake');
                    setTimeout(() => {
                        belowSection.classList.remove('speed-shake');
                    }, duration * 1000);
                }
            }

            gsap.to(counter, {
                innerHTML: target,
                duration: duration,
                snap: { innerHTML: target % 1 === 0 ? 1 : 0.1 },
                ease: "power2.out"
            });
        }
    });
});

gsap.from(".matrix-grid .stat", {
    scrollTrigger: { trigger: ".performance-matrix", start: "top 80%" },
    y: 50, opacity: 0, stagger: 0.1, duration: 1
});

// --- Horizontal Scrolling Gallery ---
const horizontalGallery = document.querySelector('.horizontal-gallery');
gsap.to(horizontalGallery, {
    x: () => -(horizontalGallery.scrollWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
        trigger: ".horizontal-gallery-container",
        start: "top top",
        end: () => "+=" + (horizontalGallery.scrollWidth - window.innerWidth),
        scrub: 1,
        pin: true,
        anticipatePin: 1
    }
});

// Subtle Parallax for images inside horizontal gallery
gsap.utils.toArray('.gallery-item img').forEach((img, i) => {
    gsap.to(img, {
        xPercent: 15,
        ease: "none",
        scrollTrigger: {
            trigger: ".horizontal-gallery-container",
            start: "top top",
            end: () => "+=" + (horizontalGallery.scrollWidth - window.innerWidth),
            scrub: 1,
        }
    });
});

// --- Dynamic Driving Modes ---
const modesBg = document.getElementById('modes-bg');
const modeText = document.querySelector('.modes-description p');
const modesSection = document.querySelector('.driving-modes');
const modes = document.querySelectorAll('.mode-hover');

modes.forEach(mode => {
    mode.addEventListener('mouseenter', () => {
        const color = mode.getAttribute('data-color');
        const bgImg = mode.getAttribute('data-bg');

        // Change section glow
        modesSection.style.backgroundColor = color;
        modesSection.style.boxShadow = `inset 0 0 150px ${color}`;
        mode.style.setProperty('--hover-color', color);

        // Change background image
        modesBg.style.backgroundImage = `url('${bgImg}')`;
        modesBg.style.opacity = '0.4';

        modeText.textContent = `${mode.textContent} MODE ENGAGED`;
        modeText.style.color = color;
    });

    mode.addEventListener('mouseleave', () => {
        modesSection.style.backgroundColor = '#000';
        modesSection.style.boxShadow = 'none';
        modesBg.style.opacity = '0.15';
        modeText.textContent = 'Select your telemetry.';
        modeText.style.color = 'var(--text-secondary)';
    });
});

// --- 13. Ad Personam Studio ---
const swatches = document.querySelectorAll('.swatch');
const adBgImg = document.getElementById('ad-bg-img');
const colorName = document.querySelector('.color-name');

swatches.forEach(swatch => {
    swatch.addEventListener('mouseenter', () => {
        const filter = swatch.getAttribute('data-color');
        const name = swatch.getAttribute('data-name');

        adBgImg.style.filter = filter;
        colorName.textContent = name;
        colorName.style.color = swatch.style.backgroundColor;
    });

    swatch.addEventListener('mouseleave', () => {
        adBgImg.style.filter = 'none';
        colorName.textContent = 'Select a shade';
        colorName.style.color = '#fff';
    });
});

// --- 14. Technical Specifications Accordion ---
const accordionHeaders = document.querySelectorAll('.accordion-header');

accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const isActive = header.classList.contains('active');
        const listItems = content.querySelectorAll('li');

        // Close others
        accordionHeaders.forEach(h => {
            if (h !== header && h.classList.contains('active')) {
                h.classList.remove('active');
                gsap.to(h.nextElementSibling, { height: 0, duration: 0.3, ease: "power2.inOut" });
            }
        });

        if (!isActive) {
            header.classList.add('active');
            const tl = gsap.timeline({
                onComplete: () => ScrollTrigger.refresh()
            });

            tl.to(content, { height: "auto", duration: 0.4, ease: "expo.out" })
                .fromTo(listItems,
                    { opacity: 0, x: -10 },
                    { opacity: 1, x: 0, stagger: 0.04, duration: 0.3, ease: "power1.out" },
                    "-=0.2"
                );
        } else {
            header.classList.remove('active');
            gsap.to(content, {
                height: 0,
                duration: 0.3,
                ease: "power2.inOut",
                onComplete: () => ScrollTrigger.refresh()
            });
        }
    });
});

// --- 12. Symphony of the V12 (Elegant Redesign) ---
const revBtn = document.getElementById('rev-btn');
const revPlayWrapper = document.querySelector('.rev-play-wrapper');
const revSound = document.getElementById('rev-sound');

gsap.to(".parallax-exhaust", {
    scrollTrigger: {
        trigger: ".engine-rev-section",
        start: "top bottom",
        end: "bottom top",
        scrub: 1
    },
    yPercent: 30,
    ease: "none"
});

if (revBtn && revSound && engineSound) {
    revBtn.addEventListener('click', () => {
        if (revSound.paused) {
            // Start revving
            revSound.currentTime = 0;
            revSound.play().catch(e => console.log("Rev audio blocked:", e));

            // Visual feedback (glassmorphic pulsing)
            revPlayWrapper.classList.add('playing');

            // Audio Ducking: Reduce background engine loop volume
            if (!engineSound.paused) {
                gsap.to(engineSound, {
                    volume: 0.05,
                    duration: 0.5,
                    ease: "power2.out"
                });
            }
        }
    });

    // When the rev sound finishes playing
    revSound.addEventListener('ended', () => {
        // Reset visual feedback
        revPlayWrapper.classList.remove('playing');

        // Restore the background engine sound volume if it's currently playing
        if (!engineSound.paused) {
            gsap.to(engineSound, {
                volume: 0.5, // back to normal idle volume
                duration: 2,
                ease: "power2.inOut"
            });
        }
    });
}
