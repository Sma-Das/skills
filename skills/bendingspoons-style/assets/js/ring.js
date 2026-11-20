// Hero card ring: cards stand on a cylinder, face inward, and turn slowly.
// Values measured from the source: 12 cards at 30 degree steps, radius 1.05 times
// the radius at which the cards would touch, perspective 1000px (set in CSS), one
// turn every 60s at constant speed, plus 27 extra degrees that ease out over the
// first 3s. The ring does not react to the pointer or to scroll.
//
//   import { ring } from "./ring.js";
//   ring(document.querySelector(".bs-ring"));
//
// Without JS the cards sit in a centred row. With reduced motion the ring is
// built but stays still.

export function ring(root, { period = 60, intro = 27, introTime = 3, spread = 1.05 } = {}) {
  const track = root.querySelector(".bs-ring-track");
  const cards = [...track.children];
  const count = cards.length;
  if (count < 3) return () => {};

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let radius = 0;
  let frame = 0;
  let visible = true;
  let elapsed = 0;
  let last = 0;

  function layout() {
    radius = (track.offsetWidth / 2 / Math.tan(Math.PI / count)) * spread;
    cards.forEach((card, index) => {
      card.style.transformOrigin = `50% 50% ${radius}px`;
      card.style.transform = `translateZ(${-radius}px) rotateY(${(-360 / count) * index}deg)`;
    });
    draw();
  }

  // circ.out: fast start, long settle.
  const circOut = t => Math.sqrt(1 - (t - 1) * (t - 1));

  function draw() {
    const lead = intro * circOut(Math.min(1, elapsed / introTime));
    const spin = (elapsed / period) * 360;
    track.style.transform = `rotateY(${(still ? intro : lead + spin).toFixed(3)}deg)`;
  }

  function tick(now) {
    frame = 0;
    if (last) elapsed += Math.min(0.1, (now - last) / 1000);
    last = now;
    draw();
    schedule();
  }
  function schedule() {
    if (!frame && visible && !document.hidden && !still) frame = requestAnimationFrame(tick);
  }
  function pause() { cancelAnimationFrame(frame); frame = 0; last = 0; }

  root.classList.add("is-ready");
  layout();

  const resize = new ResizeObserver(layout);
  resize.observe(track);
  const watch = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule(); else pause();
  });
  watch.observe(root);
  const onHide = () => { if (document.hidden) pause(); else schedule(); };
  document.addEventListener("visibilitychange", onHide);
  schedule();

  return function destroy() {
    pause();
    resize.disconnect();
    watch.disconnect();
    document.removeEventListener("visibilitychange", onHide);
    root.classList.remove("is-ready");
    track.style.transform = "";
    for (const card of cards) { card.style.transform = ""; card.style.transformOrigin = ""; }
  };
}
