/* =========================
   Meghan Wallace — main.js
   - JS mode (no-js removed)
   - Scroll reveal (IntersectionObserver) with visible fallback
   - Slider (buttons + dots + swipe + autoplay) with swipe ignoring controls
   ========================= */

document.documentElement.classList.add("js");
document.documentElement.classList.remove("no-js");

// Year in footer (если элемент есть)
const y = document.getElementById("y");
if (y) y.textContent = new Date().getFullYear();

/* =========================
   Scroll reveal (IntersectionObserver)
   ========================= */
const revealEls = document.querySelectorAll(".reveal");

function revealNow(el) {
  // Ensure the browser has painted initial styles before animating
  requestAnimationFrame(() => el.classList.add("is-visible"));
}

if (!("IntersectionObserver" in window)) {
  revealEls.forEach(revealNow);
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          revealNow(e.target);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );

  revealEls.forEach((el) => io.observe(el));
}

/* =========================
   Slider (buttons + dots + swipe)
   Markup expected:
   .slider
     .slider__track
       .slider__slide * n
     .slider__controls (we create if missing)
   ========================= */
const slider = document.querySelector(".slider");

if (slider) {
  const track = slider.querySelector(".slider__track");
  const slides = Array.from(slider.querySelectorAll(".slider__slide"));

  if (!track || slides.length === 0) {
    console.warn("Slider markup is incomplete");
  } else {
    // Stop CSS auto animation if present
    track.style.animation = "none";

    let index = 0;
    let timer = null;
    const AUTOPLAY_MS = 5000;

    // Build controls (prev/next + dots)
    let controls = slider.querySelector(".slider__controls");
    if (!controls) {
      controls = document.createElement("div");
      controls.className = "slider__controls";
      controls.innerHTML = `
        <button class="slider__btn" data-dir="-1" aria-label="Previous slide">‹</button>
        <div class="slider__dots" role="tablist" aria-label="Slider dots"></div>
        <button class="slider__btn" data-dir="1" aria-label="Next slide">›</button>
      `;
      slider.appendChild(controls);
    }

    const dotsWrap = controls.querySelector(".slider__dots");
    dotsWrap.innerHTML = slides
      .map(
        (_, i) =>
          `<button class="dot" role="tab" aria-label="Go to slide ${
            i + 1
          }" data-i="${i}"></button>`
      )
      .join("");

    const dots = Array.from(dotsWrap.querySelectorAll(".dot"));

    function setIndex(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("is-active", di === index));
    }

    function next() {
      setIndex(index + 1);
    }

    function prev() {
      setIndex(index - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      timer = window.setInterval(next, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    // Buttons + dots
    controls.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      if (btn.classList.contains("slider__btn")) {
        const dir = Number(btn.dataset.dir);
        setIndex(index + dir);
        startAutoplay();
      }

      if (btn.classList.contains("dot")) {
        const i = Number(btn.dataset.i);
        setIndex(i);
        startAutoplay();
      }
    });

    // Pause autoplay on hover/focus for accessibility
    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);
    slider.addEventListener("focusin", stopAutoplay);
    slider.addEventListener("focusout", startAutoplay);

    /* =========================
       Swipe (ignore controls)
       ========================= */
    let startX = 0;
    let currentX = 0;
    let isDown = false;

    function onDown(clientX) {
      isDown = true;
      startX = clientX;
      currentX = clientX;
      stopAutoplay();
      track.style.transition = "none";
    }

    function onMove(clientX) {
      if (!isDown) return;
      currentX = clientX;
      const dx = currentX - startX;
      track.style.transform = `translateX(calc(-${index * 100}% + ${dx}px))`;
    }

    function onUp() {
      if (!isDown) return;
      isDown = false;

      const dx = currentX - startX;
      track.style.transition = "";
      const threshold = 50;

      if (dx > threshold) prev();
      else if (dx < -threshold) next();
      else setIndex(index);

      startAutoplay();
    }

    slider.addEventListener("pointerdown", (e) => {
      // If pointerdown happens on controls, do not start swipe
      if (e.target.closest(".slider__controls")) return;

      slider.setPointerCapture(e.pointerId);
      onDown(e.clientX);
    });

    slider.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      onMove(e.clientX);
    });

    slider.addEventListener("pointerup", onUp);
    slider.addEventListener("pointercancel", onUp);

    // Init
    setIndex(0);
    startAutoplay();
  }
}
