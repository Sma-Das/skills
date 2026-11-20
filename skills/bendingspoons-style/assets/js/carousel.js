// Centred carousel: the slide nearest the centre is full size, the rest sit at
// 80%, and the caption of the active slide fades up after it settles.
//
//   import { carousel } from "./carousel.js";
//   carousel(document.querySelector(".bs-carousel"));
//
// The track is a native scroll-snap scroller, so swipe, trackpad, and keyboard
// scrolling work without this script. The script adds the active state and the
// previous and next buttons ([data-prev], [data-next]). The source loops; this
// one stops at the ends and disables the button there.

export function carousel(root) {
  const track = root.querySelector(".bs-carousel-track");
  const slides = [...track.children];
  const prev = root.querySelector("[data-prev]");
  const next = root.querySelector("[data-next]");
  if (!slides.length) return () => {};

  let active = -1;
  let frame = 0;

  function nearest() {
    const centre = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let distance = Infinity;
    slides.forEach((slide, index) => {
      const d = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - centre);
      if (d < distance) { distance = d; best = index; }
    });
    return best;
  }

  function update() {
    frame = 0;
    const index = nearest();
    if (index === active) return;
    active = index;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
      if (i === index) slide.removeAttribute("inert"); else slide.setAttribute("inert", "");
    });
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
  }

  function go(step) {
    const target = slides[Math.min(slides.length - 1, Math.max(0, active + step))];
    const left = target.offsetLeft + target.offsetWidth / 2 - track.clientWidth / 2;
    track.scrollTo({ left, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const onPrev = () => go(-1);
  const onNext = () => go(1);
  track.addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  root.classList.add("is-enhanced");
  update();

  return function destroy() {
    cancelAnimationFrame(frame);
    track.removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
    prev?.removeEventListener("click", onPrev);
    next?.removeEventListener("click", onNext);
    root.classList.remove("is-enhanced");
    for (const slide of slides) { slide.classList.remove("is-active"); slide.removeAttribute("inert"); }
  };
}
