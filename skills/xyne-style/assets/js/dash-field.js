// Pointer- and touch-reactive dash field: a grid of short rounded pills that swing
// toward the cursor or finger, thicken, and brighten near it. Decorative only.
//
//   import { dashField } from "./dash-field.js";
//   const stop = dashField(document.querySelector(".xs-field"));
//
// The response curve was measured from xyne.ai's hero. For a dash at distance d
// from the pointer, with a = angle from the dash to the pointer (degrees):
//   f         = (1 - d / R) ^ 1.8          R ≈ 0.46 × field width (660px at 1440)
//   rotation  = 90° + f · (a − 90°)         rest is vertical
//   thickness = 8px · (0.375 + 0.625 f)     3px at rest
//   opacity   = 0.62 + 0.38 f
// Colour comes from the host's CSS `color` (set it to var(--brand)).

const DEFAULTS = {
  cellX: 33,          // px per column; the column count is width / cellX
  cellY: 41,          // px per row
  length: 29,         // dash length in px (capped by the cell width)
  thickness: 8,       // full thickness; rest thickness is thickness × restScale
  restScale: 0.375,
  restOpacity: 0.62,
  reach: 0.46,        // influence radius as a share of the field width
  minReach: 220,      // px, so phones still get a usable radius
  falloff: 1.8,
  follow: 0.18,       // per-frame smoothing of the tracked point, 0..1
  fade: 0.08,         // per-frame smoothing of the effect turning on and off
  lockTouch: false,   // true: dragging on the field steers it and does not scroll the page
  idle: false,        // true: drift slowly when nobody is pointing (source stays still)
};

export function dashField(host, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const canvas = document.createElement("canvas");
  host.setAttribute("aria-hidden", "true");
  host.style.touchAction = o.lockTouch ? "pinch-zoom" : "pan-y pinch-zoom";
  host.append(canvas);
  const ctx = canvas.getContext("2d");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  let w = 0, h = 0, dpr = 1, radius = 600;
  let cells = [];
  let color = getComputedStyle(host).color;
  let target = null;               // where the pointer is, in field coordinates
  const point = { x: 0, y: 0 };    // smoothed point the dashes react to
  let strength = 0;                // 0 = at rest, 1 = fully reacting
  let frame = 0, visible = true, idleStart = performance.now(), lastInput = 0;

  function layout() {
    const box = host.getBoundingClientRect();
    w = box.width; h = box.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    radius = Math.max(o.minReach, w * o.reach);
    const cols = Math.max(1, Math.round(w / o.cellX));
    const rows = Math.max(1, Math.round(h / o.cellY));
    const cw = w / cols, ch = h / rows;
    cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: (c + 0.5) * cw, y: (r + 0.5) * ch });
    o._len = Math.min(o.length, cw - 4, ch * 0.9);
    draw();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    const len = o._len, half = len / 2;
    for (const c of cells) {
      let f = 0, rot = Math.PI / 2;
      if (strength > 0.001) {
        const dx = point.x - c.x, dy = point.y - c.y;
        const d = Math.hypot(dx, dy);
        if (d < radius) {
          f = Math.pow(1 - d / radius, o.falloff) * strength;
          const a = Math.atan2(dy, dx);                  // -π..π, toward the pointer
          rot = Math.PI / 2 + f * (a - Math.PI / 2);
        }
      }
      const t = o.thickness * (o.restScale + (1 - o.restScale) * f);
      ctx.globalAlpha = o.restOpacity + (1 - o.restOpacity) * f;
      ctx.setTransform(dpr, 0, 0, dpr, c.x * dpr, c.y * dpr);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.roundRect(-half, -t / 2, len, t, Math.min(1, t / 2));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    if (!visible) return;
    let goal = target;
    // Idle drift: a slow loop across the field after a few seconds without input.
    if (!goal && o.idle && !motion.matches && now - lastInput > 2500) {
      const t = (now - idleStart) / 1000;
      goal = { x: w * (0.5 + 0.32 * Math.sin(t * 0.35)), y: h * (0.5 + 0.3 * Math.sin(t * 0.53 + 1)) };
    }
    const want = goal ? (target ? 1 : 0.55) : 0;
    if (goal) {
      if (strength < 0.01) { point.x = goal.x; point.y = goal.y; }
      point.x += (goal.x - point.x) * o.follow;
      point.y += (goal.y - point.y) * o.follow;
    }
    strength += (want - strength) * o.fade;
    draw();
    const settled = !goal && strength < 0.002;
    if (settled) { strength = 0; draw(); if (o.idle && !motion.matches) setTimeout(wake, 2600); return; }
    frame = requestAnimationFrame(tick);
  }

  function wake() { if (!frame && visible && !motion.matches) frame = requestAnimationFrame(tick); }

  function locate(clientX, clientY) {
    const box = host.getBoundingClientRect();
    const x = clientX - box.left, y = clientY - box.top;
    // Track a little past the edges so the field keeps reacting as you approach it.
    target = (x > -80 && x < w + 80 && y > -80 && y < h + 80) ? { x, y } : null;
    lastInput = performance.now();
    wake();
  }
  const onPointer = e => { if (e.pointerType !== "touch") locate(e.clientX, e.clientY); };
  const onTouch = e => { const t = e.touches[0]; if (t) locate(t.clientX, t.clientY); };
  const onTouchLocked = e => { onTouch(e); if (e.cancelable) e.preventDefault(); };
  const onEnd = () => { target = null; lastInput = performance.now(); wake(); };

  const zone = host.closest("section, header, main") || host;
  zone.addEventListener("pointermove", onPointer, { passive: true });
  zone.addEventListener("pointerdown", onPointer, { passive: true });
  zone.addEventListener("pointerleave", onEnd, { passive: true });
  // Touch: follow the finger while it is down. Passive listeners keep page scrolling
  // intact; with lockTouch the field itself becomes a drag surface instead.
  const touchOpts = { passive: !o.lockTouch };
  host.addEventListener("touchstart", o.lockTouch ? onTouchLocked : onTouch, touchOpts);
  host.addEventListener("touchmove", o.lockTouch ? onTouchLocked : onTouch, touchOpts);
  host.addEventListener("touchend", onEnd, { passive: true });
  host.addEventListener("touchcancel", onEnd, { passive: true });

  const resize = new ResizeObserver(layout);
  resize.observe(host);
  const seen = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); });
  seen.observe(host);

  const recolor = () => { color = getComputedStyle(host).color; draw(); };
  const themeWatch = new MutationObserver(recolor);
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-fidelity", "class"] });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", recolor);
  const onMotion = () => { if (motion.matches) { cancelAnimationFrame(frame); frame = 0; strength = 0; target = null; draw(); } else wake(); };
  motion.addEventListener("change", onMotion);

  layout();
  wake();

  return function destroy() {
    cancelAnimationFrame(frame);
    zone.removeEventListener("pointermove", onPointer);
    zone.removeEventListener("pointerdown", onPointer);
    zone.removeEventListener("pointerleave", onEnd);
    host.removeEventListener("touchstart", o.lockTouch ? onTouchLocked : onTouch);
    host.removeEventListener("touchmove", o.lockTouch ? onTouchLocked : onTouch);
    host.removeEventListener("touchend", onEnd);
    host.removeEventListener("touchcancel", onEnd);
    resize.disconnect(); seen.disconnect(); themeWatch.disconnect();
    scheme.removeEventListener("change", recolor);
    motion.removeEventListener("change", onMotion);
    canvas.remove();
  };
}
