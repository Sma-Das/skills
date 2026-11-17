// Pointer-reactive dash field: a grid of short rounded strokes that lean toward
// the pointer and brighten near it. Decorative only; the host stays aria-hidden.
//
//   import { dashField } from "./dash-field.js";
//   const stop = dashField(document.querySelector(".xs-field"), { spacingX: 33, spacingY: 41 });
//
// Colour comes from the host's CSS `color` (set to var(--brand)), re-read on theme change.

const DEFAULTS = {
  spacingX: 33,     // px between dash centres
  spacingY: 41,
  length: 0.72,     // dash length as a share of spacingY
  thickness: 3,     // px at rest
  boost: 1.8,       // extra thickness near the pointer
  restOpacity: 0.62,
  radius: 320,      // px influence radius
  lean: 1,          // 0 = stay vertical, 1 = point straight at the pointer
  ease: 0.14,       // per-frame approach to target, 0..1
};

export function dashField(host, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const ctx = canvas.getContext("2d");
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");

  let dashes = [];
  let width = 0, height = 0, dpr = 1;
  let pointer = null;
  let frame = 0;
  let color = getComputedStyle(host).color;

  function layout() {
    const rect = host.getBoundingClientRect();
    width = rect.width; height = rect.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const cols = Math.max(1, Math.floor(width / o.spacingX));
    const rows = Math.max(1, Math.floor(height / o.spacingY));
    const gapX = cols > 1 ? (width - o.thickness * 2) / (cols - 1) : 0;
    const gapY = rows > 1 ? (height - o.spacingY * o.length) / (rows - 1) : 0;
    const half = (o.spacingY * o.length) / 2;
    const prev = dashes;
    dashes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const old = prev[r * cols + c];
        dashes.push({
          x: o.thickness + c * gapX,
          y: half + r * gapY,
          a: old?.a ?? 0, k: old?.k ?? 0,
        });
      }
    }
    draw();
  }

  function targetFor(d) {
    if (!pointer) return { a: 0, k: 0 };
    const dx = pointer.x - d.x, dy = pointer.y - d.y;
    const dist = Math.hypot(dx, dy);
    const k = Math.max(0, 1 - dist / o.radius);
    // Angle from vertical toward the pointer, folded so a stroke never flips.
    let a = Math.atan2(dx, -dy);
    if (a > Math.PI / 2) a -= Math.PI; else if (a < -Math.PI / 2) a += Math.PI;
    return { a: a * o.lean * Math.min(1, k * 2.2), k: k * k };
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    const len = o.spacingY * o.length;
    for (const d of dashes) {
      const t = o.thickness * (1 + o.boost * d.k);
      ctx.globalAlpha = o.restOpacity + (1 - o.restOpacity) * d.k;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.a);
      ctx.beginPath();
      ctx.roundRect(-t / 2, -len / 2, t, len, 1);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function tick() {
    frame = 0;
    let moving = false;
    for (const d of dashes) {
      const t = targetFor(d);
      const da = t.a - d.a, dk = t.k - d.k;
      if (Math.abs(da) > 0.002 || Math.abs(dk) > 0.002) moving = true;
      d.a += da * o.ease; d.k += dk * o.ease;
    }
    draw();
    if (moving) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (motionQuery.matches) return;
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function onMove(event) {
    // Touch input scrolls the page; only a tap moves the focus point.
    if (event.pointerType === "touch" && event.type === "pointermove") return;
    const rect = host.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    wake();
  }
  function onLeave() { pointer = null; wake(); }

  const target = host.closest("section, header, main") || host;
  target.addEventListener("pointermove", onMove, { passive: true });
  target.addEventListener("pointerdown", onMove, { passive: true });
  target.addEventListener("pointerleave", onLeave, { passive: true });

  const resize = new ResizeObserver(layout);
  resize.observe(host);

  const recolor = () => { color = getComputedStyle(host).color; draw(); };
  const themeWatch = new MutationObserver(recolor);
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-fidelity", "class"] });
  const schemeQuery = matchMedia("(prefers-color-scheme: dark)");
  schemeQuery.addEventListener("change", recolor);
  const onMotion = () => { if (motionQuery.matches) { pointer = null; for (const d of dashes) { d.a = 0; d.k = 0; } draw(); } };
  motionQuery.addEventListener("change", onMotion);

  layout();

  return function destroy() {
    cancelAnimationFrame(frame);
    target.removeEventListener("pointermove", onMove);
    target.removeEventListener("pointerdown", onMove);
    target.removeEventListener("pointerleave", onLeave);
    resize.disconnect();
    themeWatch.disconnect();
    schemeQuery.removeEventListener("change", recolor);
    motionQuery.removeEventListener("change", onMotion);
    canvas.remove();
  };
}
