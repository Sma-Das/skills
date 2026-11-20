// Isometric line illustrations in the Bending Spoons style, from a short scene
// description. No dependencies. Works in the browser and in Node, and returns
// an SVG string, so the same scene can be mounted at runtime or written to a
// file with scripts/iso-render.mjs.
//
//   import { render, mount } from "./iso.js";
//   mount(el, {
//     width: 652, height: 400, align: "bottom",
//     items: [
//       { type: "rings", shape: "round", count: 4, size: 3, step: 1.2 },
//       { type: "stack", count: 4, gap: 0.5, accent: 3,
//         item: { type: "slab", size: [3, 3, 0.12], radius: 0.6, material: "glass" } },
//     ],
//   });
//
// World axes: x runs down-right, y runs down-left, z runs up. One unit is the
// same length along all three. The viewer looks from +x, +y, +z, so a solid
// shows its top, its +x face (right), and its +y face (left).
// references/isometric.md documents every item type and option.

const TAU = Math.PI * 2;
const rad = deg => (deg * Math.PI) / 180;
const num = v => (Math.abs(v) < 0.005 ? "0" : (Math.round(v * 100) / 100).toString());
const px = v => (Math.round(v * 10) / 10).toString();
const clamp01 = v => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------------ projection */

// Project a world point to unit screen space (before scale and origin).
// `angle` is the angle of the x and y axes above the horizontal: 30 is true
// isometric, lower angles flatten the ground (15 is close to the source's
// disc scenes).
export function project([x, y, z = 0], angle = 30) {
  const a = rad(angle);
  return [(x - y) * Math.cos(a), (x + y) * Math.sin(a) - z];
}

// Distance toward the viewer along the view direction (1, 1, 2 sin a).
// Larger is nearer.
export function depthOf([x, y, z = 0], angle = 30) {
  return x + y + 2 * Math.sin(rad(angle)) * z;
}

function bboxOf(pts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let i = 0; i < 3; i++) {
    const v = p[i] ?? 0;
    if (v < min[i]) min[i] = v;
    if (v > max[i]) max[i] = v;
  }
  return { min, max };
}

/* ------------------------------------------------------------------ ordering */

// Is fragment a behind fragment b? 1 yes, -1 the reverse, 0 cannot tell.
// Two boxes that do not interpenetrate are separated along at least one axis,
// and the one on the low side of that axis is the farther one.
export function behind(a, b, eps = 1e-6) {
  let ab = false;
  let ba = false;
  for (let i = 0; i < 3; i++) {
    if (a.bbox.max[i] <= b.bbox.min[i] + eps) ab = true;
    if (b.bbox.max[i] <= a.bbox.min[i] + eps) ba = true;
  }
  if (ab && !ba) return 1;
  if (ba && !ab) return -1;
  return 0;
}

// Painter's order, far to near. Fragments are first ranked by layer and by the
// depth of their centre. Every pair whose screen boxes overlap then gets a
// fixed order: from `behind` when it can tell, from the rank when it cannot.
// Pairs that do not overlap may go in any order, which lets the pieces of one
// polyline stay together. Each fragment needs bbox, depth, rect and layer.
export function sortFragments(fragments) {
  const order = fragments
    .map((frag, index) => ({ frag, index }))
    .sort((p, q) => (p.frag.layer - q.frag.layer) || (p.frag.depth - q.frag.depth) || (p.index - q.index))
    .map(entry => entry.frag);
  const n = order.length;
  const after = Array.from({ length: n }, () => []);
  const waiting = new Int32Array(n);
  const layerOf = new Int32Array(n);
  const pieces = new Map();
  for (let i = 0, layer = 0; i < n; i++) {
    if (i && order[i].layer !== order[i - 1].layer) layer++;
    layerOf[i] = layer;
    if (order[i].chain !== undefined) pieces.set(order[i].chain + ":" + order[i].seq, i);
  }
  for (let i = 0; i < n; i++) {
    const a = order[i];
    for (let j = i + 1; j < n; j++) {
      const b = order[j];
      if (layerOf[i] !== layerOf[j]) break;
      if (a.rect[0] >= b.rect[2] || b.rect[0] >= a.rect[2] || a.rect[1] >= b.rect[3] || b.rect[1] >= a.rect[3]) continue;
      if (a.kind === "line" && b.kind === "line") continue;          // lines never hide each other
      if (behind(a, b) === -1) { after[j].push(i); waiting[i]++; }   // b first
      else { after[i].push(j); waiting[j]++; }                       // a first: proven, or by rank
    }
  }
  // Kahn's algorithm. Stay on the current polyline while its next piece is
  // free; otherwise take the lowest-ranked free fragment in the current layer.
  const out = [];
  const done = new Uint8Array(n);
  let cursor = 0;
  let last = -1;
  const free = i => i !== undefined && !done[i] && waiting[i] === 0 && layerOf[i] === layerOf[cursor];
  while (out.length < n) {
    let pick = -1;
    if (last >= 0 && order[last].chain !== undefined) {
      const { chain, seq } = order[last];
      const next = pieces.get(chain + ":" + (seq + 1));
      const prev = pieces.get(chain + ":" + (seq - 1));
      if (free(next)) pick = next; else if (free(prev)) pick = prev;
    }
    if (pick === -1) for (let i = cursor; i < n && layerOf[i] === layerOf[cursor]; i++) if (!done[i] && waiting[i] === 0) { pick = i; break; }
    if (pick === -1) for (let i = cursor; i < n; i++) if (!done[i]) { pick = i; break; }   // a cycle: fall back to rank
    done[pick] = 1;
    out.push(order[pick]);
    last = pick;
    for (const j of after[pick]) waiting[j]--;
    while (cursor < n && done[cursor]) cursor++;
  }
  return out;
}

/* ------------------------------------------------------------------ outlines */

// Outlines are counter-clockwise lists of [x, y] with a `sharp` flag on true
// corners, so solids know where to draw vertical edges.
function rectOutline(w, d, radius = 0, turn = 0) {
  const hw = w / 2;
  const hd = d / 2;
  const r = Math.min(radius, hw, hd);
  let pts = [];
  if (r <= 0) {
    pts = [[hw, -hd], [hw, hd], [-hw, hd], [-hw, -hd]].map(p => Object.assign(p, { sharp: true }));
  } else {
    const corners = [[hw - r, hd - r, 0], [-hw + r, hd - r, 90], [-hw + r, -hd + r, 180], [hw - r, -hd + r, 270]];
    const steps = 8;
    for (const [cx, cy, start] of corners) {
      for (let i = 0; i <= steps; i++) {
        const t = rad(start + (90 * i) / steps);
        pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
      }
    }
  }
  return turn ? rotate(pts, turn) : pts;
}

function circleOutline(r, segments = 64) {
  return Array.from({ length: segments }, (_, i) => [r * Math.cos((TAU * i) / segments), r * Math.sin((TAU * i) / segments)]);
}

function ngonOutline(r, sides, turn = 0) {
  return rotate(Array.from({ length: sides }, (_, i) => Object.assign([r * Math.cos((TAU * i) / sides), r * Math.sin((TAU * i) / sides)], { sharp: true })), turn);
}

function rotate(pts, deg) {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return pts.map(p => Object.assign([p[0] * c - p[1] * s, p[0] * s + p[1] * c], { sharp: p.sharp }));
}

function outlineFor(item) {
  const [w = 1, d = w] = item.size ?? [];
  if (item.outline) return item.outline.map(p => Object.assign([p[0], p[1]], { sharp: true }));
  switch (item.type) {
    case "cylinder": case "disc": case "cone": case "ring":
      return circleOutline(item.radius ?? w / 2, item.segments ?? 64);
    case "hex": return ngonOutline(item.radius ?? w / 2, 6, item.turn ?? 0);
    case "prism": return ngonOutline(item.radius ?? w / 2, item.sides ?? 6, item.turn ?? 0);
    case "pyramid": return item.sides && item.sides !== 4 ? ngonOutline(item.radius ?? w / 2, item.sides, item.turn ?? 0) : rectOutline(w, d, 0, item.turn ?? 0);
    default: return rectOutline(w, d, item.radius ?? 0, item.turn ?? 0);
  }
}

/* ------------------------------------------------------------------ materials */

// Each material says how faces are filled and which edges are drawn.
// Fill pairs are tint opacities [start, end]: back to front on a top face,
// top to bottom on a side face. `base` paints the background colour first so
// the solid hides what is behind it.
const MATERIALS = {
  solid: { base: true, top: [0.3, 0.52], left: [0.16, 0.07], right: [0.07, 0.13], edge: 0, hidden: 0 },
  glass: { base: false, top: [0.03, 0.14], left: [0.1, 0.02], right: [0.06, 0.01], edge: 0.85, hidden: 0 },
  panel: { base: true, top: [0.05, 0.16], left: [0.12, 0.04], right: [0.07, 0.02], edge: 0.85, hidden: 0 },
  wire: { base: false, top: null, left: null, right: null, edge: 0.5, hidden: 0.22 },
  ghost: { base: false, top: null, left: null, right: null, edge: 0.4, hidden: 0, dash: [5, 4] },
};

const DEFAULTS = { width: 652, height: 400, angle: 30, padding: 24, align: "center", weight: 1.25, depthFade: 0.35, segment: 0.5 };

/* ------------------------------------------------------------------ building fragments */

function resolveStyle(item, scene) {
  const material = MATERIALS[item.material ?? "wire"] ?? MATERIALS.wire;
  const accent = item.accent === true;
  const stroke = { color: accent ? "accent" : item.tone ?? "ink", opacity: accent ? 1 : material.edge, width: scene.weight * (accent ? 1.2 : 1), dash: material.dash ?? null, ...(item.stroke ?? {}) };
  if (item.dash) stroke.dash = item.dash === true ? [5, 4] : item.dash;
  const fill = { color: accent ? "sage" : item.tint ?? item.tone ?? "ink", top: material.top, left: material.left, right: material.right, base: material.base, ...(item.fill ?? {}) };
  if (accent && material.top) {
    fill.top = fill.top.map(v => v * 1.25);
    fill.left = fill.left && fill.left.map(v => v * 1.6);
    fill.right = fill.right && fill.right.map(v => v * 1.6);
  }
  const hidden = item.hidden === undefined ? material.hidden : item.hidden === true ? 0.25 : Number(item.hidden) || 0;
  return { stroke, fill, hidden, opacity: item.opacity ?? 1 };
}

function builder(scene) {
  const fragments = [];
  let owner = 0;
  let chain = 0;

  const add = frag => {
    frag.bbox = frag.bbox ?? bboxOf(frag.pts);
    const c = [0, 1, 2].map(i => (frag.bbox.min[i] + frag.bbox.max[i]) / 2);
    frag.depth = frag.depth ?? depthOf(c, scene.angle);
    frag.layer = frag.layer ?? 0;
    fragments.push(frag);
    return frag;
  };

  // A polyline is cut into short pieces so each can be ordered on its own.
  // Pieces that end up next to each other are joined again when drawing.
  function line(pts, stroke, extra = {}) {
    const id = ++chain;
    let seq = 0;
    let travelled = 0;
    const closed = extra.closed === true;
    const all = closed ? [...pts, pts[0]] : pts;
    const total = all.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - all[i][0], p[1] - all[i][1], p[2] - all[i][2]), 0) || 1;
    for (let i = 0; i < all.length - 1; i++) {
      const a = all[i];
      const b = all[i + 1];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const pieces = Math.max(1, Math.ceil(length / scene.segment));
      for (let k = 0; k < pieces; k++) {
        const p = [0, 1, 2].map(j => lerp(a[j], b[j], k / pieces));
        const q = [0, 1, 2].map(j => lerp(a[j], b[j], (k + 1) / pieces));
        const at = (travelled + (length * (k + 0.5)) / pieces) / total;
        let fade = 1;
        if (extra.fade === "end") fade = 1 - at;
        else if (extra.fade === "start") fade = at;
        else if (extra.fade === "both") fade = 1 - Math.abs(at * 2 - 1);
        add({ kind: "line", pts: [p, q], stroke, chain: id, seq: seq++, ...extra, fade: fade ** 1.4, closed: false });
      }
      travelled += length;
    }
  }

  const lift = (outline, at, z, k = 1) => outline.map(p => [at[0] + p[0] * k, at[1] + p[1] * k, at[2] + z]);

  // Any upright solid: an outline swept from z0 to z1, optionally tapering to
  // `taper` times its size at the top (0 makes a cone or pyramid).
  function solid(item, outline, height, taper = 1) {
    const style = resolveStyle(item, scene);
    const at = item.at ?? [0, 0, 0];
    const me = ++owner;
    const common = { owner: me, layer: item.layer ?? 0, anim: item.animate, alpha: style.opacity, noFit: item.fit === false };
    const n = outline.length;
    const bottom = lift(outline, at, 0);
    const top = lift(outline, at, height, taper);
    const flat = height <= 1e-9;
    const view = [1, 1, 2 * Math.sin(rad(scene.angle))];
    const smooth = !outline.some(p => p.sharp);

    // Which side faces look at the viewer.
    const front = outline.map((_, i) => {
      if (flat) return false;
      const j = (i + 1) % n;
      const u = [bottom[j][0] - bottom[i][0], bottom[j][1] - bottom[i][1], 0];
      const v = [top[i][0] - bottom[i][0], top[i][1] - bottom[i][1], height];
      const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      return normal[0] * view[0] + normal[1] * view[1] + normal[2] * view[2] > 1e-9;
    });
    const anyBack = front.some(f => !f);
    const start = anyBack ? front.findIndex((f, i) => f && !front[(i + n - 1) % n]) : 0;
    const run = [];
    if (!flat) for (let k = 0; k < n; k++) { const i = (start + k) % n; if (!front[i]) break; run.push(i); }

    // Side faces.
    if (!flat && run.length && (style.fill.left || style.fill.base)) {
      if (smooth) {
        const lower = run.map(i => bottom[i]).concat([bottom[(run.at(-1) + 1) % n]]);
        const upper = run.map(i => top[i]).concat([top[(run.at(-1) + 1) % n]]);
        add({ kind: "face", pts: [...lower, ...upper.reverse()], fill: { ...style.fill, pair: style.fill.left && style.fill.right ? [(style.fill.left[0] + style.fill.left[1]) / 2, (style.fill.right[0] + style.fill.right[1]) / 2] : null, sweep: "h" }, ...common });
      } else {
        for (const i of run) {
          const j = (i + 1) % n;
          const nx = bottom[j][1] - bottom[i][1];
          const ny = -(bottom[j][0] - bottom[i][0]);
          const t = clamp01(Math.atan2(nx, ny) / (Math.PI / 2));     // 0 faces +y (left), 1 faces +x (right)
          const pair = style.fill.left && style.fill.right ? [lerp(style.fill.left[0], style.fill.right[0], t), lerp(style.fill.left[1], style.fill.right[1], t)] : null;
          add({ kind: "face", pts: [bottom[i], bottom[j], top[j], top[i]], fill: { ...style.fill, pair, sweep: "v", color: item.accent === true && t > 0.5 ? "ink" : style.fill.color }, ...common });
        }
      }
    }
    // Top face.
    if (taper > 0 && (style.fill.top || style.fill.base)) {
      add({ kind: "face", pts: top, fill: { ...style.fill, pair: style.fill.top, sweep: "v" }, ...common });
    }
    // Edges.
    if (style.stroke.opacity > 0) {
      const s = style.stroke;
      if (taper > 0) line(top, s, { ...common, closed: true });
      if (!flat) {
        const ends = run.length ? [run[0], (run.at(-1) + 1) % n] : [];
        const uprights = new Set(ends);
        for (const i of run) if (outline[i].sharp) uprights.add(i);
        for (const i of uprights) line([bottom[i], top[i]], s, common);
        if (run.length) line(run.map(i => bottom[i]).concat([bottom[(run.at(-1) + 1) % n]]), s, common);
      }
    }
    if (!flat && style.hidden > 0 && anyBack) {
      const s = { ...style.stroke, opacity: style.hidden, dash: style.stroke.dash ?? [4, 4], width: scene.weight * 0.9 };
      const back = [];
      for (let k = 0; k < n; k++) { const i = (start + run.length + k) % n; if (front[i]) break; back.push(i); }
      if (back.length) {
        line(back.map(i => bottom[i]).concat([bottom[(back.at(-1) + 1) % n]]), s, { ...common, under: true });
        for (const i of back.slice(1)) if (outline[i].sharp) line([bottom[i], top[i]], s, { ...common, under: true });
      }
    }
    if (item.accent === true && item.glow !== false) glow({ at: [at[0], at[1], at[2]], radius: Math.max(...outline.map(p => Math.hypot(p[0], p[1]))) * 1.5, strength: item.glow ?? 0.3, layer: (item.layer ?? 0) - 0.5 });
    return { top, bottom };
  }

  function glow(item) {
    const at = item.at ?? [0, 0, 0];
    const r = item.radius ?? 2;
    add({ kind: "glow", pts: [at], bbox: bboxOf([[at[0] - r, at[1] - r, at[2]], [at[0] + r, at[1] + r, at[2]]]), radius: r, color: item.tone ?? "accent", strength: item.strength ?? 0.3, layer: item.layer ?? -1, anim: item.animate, noFit: true });
  }

  function sphere(item, dome = false) {
    const style = resolveStyle({ material: "solid", ...item }, scene);
    const at = item.at ?? [0, 0, 0];
    const r = item.radius ?? (item.size ? item.size[0] / 2 : 1);
    const me = ++owner;
    const centre = dome ? at : [at[0], at[1], at[2] + r];
    const common = { owner: me, layer: item.layer ?? 0, anim: item.animate, alpha: style.opacity };
    const box = dome
      ? bboxOf([[at[0] - r, at[1] - r, at[2]], [at[0] + r, at[1] + r, at[2] + r]])
      : bboxOf([[centre[0] - r, centre[1] - r, centre[2] - r], [centre[0] + r, centre[1] + r, centre[2] + r]]);
    add({ kind: dome ? "dome" : "sphere", pts: [centre], bbox: box, radius: r, style, material: item.material ?? "solid", ...common });
    if (dome) {
      const base = lift(circleOutline(r), at, 0);
      line(base, style.stroke, { ...common, closed: true });
      for (const turn of item.meridians === undefined ? [] : [].concat(item.meridians)) {
        const arc = Array.from({ length: 25 }, (_, i) => { const t = (Math.PI * i) / 24; return [at[0] + r * Math.cos(t) * Math.cos(rad(turn)), at[1] + r * Math.cos(t) * Math.sin(rad(turn)), at[2] + r * Math.sin(t)]; });
        line(arc, { ...style.stroke, opacity: style.stroke.opacity * 0.45 }, common);
      }
    } else if (item.equator) {
      line(lift(circleOutline(r), centre, 0), { ...style.stroke, opacity: 0.5 }, { ...common, closed: true });
    }
    if (item.accent === true && item.glow !== false) glow({ at, radius: r * 1.8, strength: item.glow ?? 0.3, layer: (item.layer ?? 0) - 0.5 });
  }

  const handlers = {
    box: item => solid(item, outlineFor(item), item.size?.[2] ?? 1),
    slab: item => solid(item, outlineFor(item), item.size?.[2] ?? 0.12),
    plate: item => solid(item, outlineFor(item), 0),
    cylinder: item => solid(item, outlineFor(item), item.height ?? item.size?.[2] ?? 1),
    disc: item => solid(item, outlineFor(item), 0),
    hex: item => solid(item, outlineFor(item), item.height ?? item.size?.[2] ?? 1),
    prism: item => solid(item, outlineFor(item), item.height ?? item.size?.[2] ?? 1, item.taper ?? 1),
    cone: item => solid(item, outlineFor(item), item.height ?? item.size?.[2] ?? 1, item.taper ?? 0),
    pyramid: item => solid(item, outlineFor(item), item.height ?? item.size?.[2] ?? 1, item.taper ?? 0),
    sphere: item => sphere(item),
    dome: item => sphere(item, true),
    glow,

    // A circle or outline drawn as a line only.
    ring(item) {
      const style = resolveStyle({ material: "wire", ...item }, scene);
      const at = item.at ?? [0, 0, 0];
      line(lift(outlineFor(item), at, 0), { ...style.stroke, opacity: item.accent === true ? 1 : item.opacity ?? 0.6 }, { owner: ++owner, layer: item.layer ?? 0, anim: item.animate, closed: true, noFit: item.fit === false });
    },

    // Concentric floor outlines that fade outward. The last one is dashed.
    rings(item) {
      const count = item.count ?? 4;
      const at = item.at ?? [0, 0, 0];
      for (let i = 0; i < count; i++) {
        const size = (item.size ?? 2) + i * (item.step ?? 1) * 2;
        const outline = item.shape === "circle" ? circleOutline(size / 2, 72) : rectOutline(size, size, item.shape === "round" ? size * (item.corner ?? 0.22) : 0);
        const t = count === 1 ? 0 : i / (count - 1);
        const first = i === 0 && item.accent !== false;
        line(lift(outline, at, 0), {
          color: first ? item.tone ?? "sage" : i < (item.tinted ?? 2) ? item.tone ?? "sage" : "ink",
          opacity: lerp(item.opacity ?? 0.7, 0.14, t),
          width: scene.weight * (first ? 1.2 : 1),
          dash: i === count - 1 && item.dashed !== false ? [5, 6] : null,
        }, { owner: ++owner, layer: item.layer ?? -1, closed: true, noFit: item.fit !== true, anim: item.animate && { ...normAnim(item.animate), delay: (normAnim(item.animate).delay ?? 0) + i * 0.14 } });
      }
    },

    // A floor grid. Lines fade toward the edges.
    grid(item) {
      const size = item.size ?? 8;
      const step = item.step ?? 1;
      const at = item.at ?? [0, 0, 0];
      const half = size / 2;
      const stroke = { color: item.tone ?? "ink", opacity: item.opacity ?? 0.22, width: scene.weight * 0.8, dash: item.dash === true ? [3, 5] : item.dash ?? null };
      for (let v = -half; v <= half + 1e-9; v += step) {
        const edge = 1 - (Math.abs(v) / half) ** 2 * 0.75;
        const s = { ...stroke, opacity: stroke.opacity * edge };
        line([[at[0] - half, at[1] + v, at[2]], [at[0] + half, at[1] + v, at[2]]], s, { layer: item.layer ?? -1, fade: "both", noFit: item.fit !== true });
        line([[at[0] + v, at[1] - half, at[2]], [at[0] + v, at[1] + half, at[2]]], s, { layer: item.layer ?? -1, fade: "both", noFit: item.fit !== true });
      }
    },

    // A free polyline through 3D points. `round` softens the corners.
    line(item) {
      const style = resolveStyle({ material: "wire", ...item }, scene);
      const stroke = { ...style.stroke, opacity: item.accent === true ? 1 : item.opacity ?? item.stroke?.opacity ?? 0.5 };
      const pts = item.round ? rounded(item.points, item.round) : item.points;
      line(pts, stroke, { owner: ++owner, layer: item.layer ?? 0, anim: item.animate, fade: item.fade, closed: item.closed === true, noFit: item.fit === false });
      if (item.travel) add({ kind: "travel", pts, stroke: { color: item.travel === true ? "sage" : item.travel, width: scene.weight * 2.2 }, layer: (item.layer ?? 0) + 0.25, delay: item.delay ?? 0, duration: item.duration });
    },

    // A connector that runs along the axes from one point to another: first
    // along x, then y, then z. `via` changes the order, for example "zxy".
    link(item) {
      const [a, b] = [item.from, item.to];
      const pts = [a.slice()];
      const cursor = a.slice();
      for (const axis of item.via ?? "xyz") {
        const i = "xyz".indexOf(axis);
        if (Math.abs(cursor[i] - b[i]) < 1e-9) continue;
        cursor[i] = b[i];
        pts.push(cursor.slice());
      }
      handlers.line({ ...item, type: "line", points: pts, round: item.round ?? 0.25 });
      if (item.dots !== false) for (const p of [a, b]) handlers.dot({ at: p, tone: item.accent === true ? "accent" : item.tone, radius: 2, layer: item.layer });
    },

    // A dashed vertical from a point down to the ground, with a small ring.
    drop(item) {
      const at = item.at ?? [0, 0, 1];
      const ground = [at[0], at[1], item.to ?? 0];
      const stroke = { color: item.tone ?? "ink", opacity: item.opacity ?? 0.4, width: scene.weight * 0.9, dash: [3, 4] };
      line([at, ground], stroke, { owner: ++owner, layer: item.layer ?? 0, noFit: item.fit !== true });
      line(lift(circleOutline(item.radius ?? 0.18, 20), ground, 0), { ...stroke, dash: null }, { owner, layer: item.layer ?? 0, closed: true, noFit: item.fit !== true });
    },

    // A point of light: a small filled dot with a halo.
    dot(item) {
      const at = item.at ?? [0, 0, 0];
      const e = 0.05;
      add({ kind: "dot", pts: [at], bbox: bboxOf([[at[0] - e, at[1] - e, at[2] - e], [at[0] + e, at[1] + e, at[2] + e]]), radius: item.radius ?? 2.5, color: item.accent === true ? "accent" : item.tone ?? "ink", halo: item.halo ?? item.accent === true, layer: item.layer ?? 0, anim: item.animate, alpha: item.opacity ?? 1, noFit: item.fit !== true });
    },

    // Short parallel strokes on a top face, standing in for text or data.
    rows(item) {
      const at = item.at ?? [0, 0, 0];
      const [w = 1, d = 1] = item.size ?? [];
      const rows = item.rows ?? 4;
      const lengths = item.lengths ?? [0.9, 0.6, 0.75, 0.45, 0.8, 0.55];
      const stroke = { color: item.accent === true ? "accent" : item.tone ?? "ink", opacity: item.opacity ?? 0.8, width: scene.weight * 1.3 };
      for (let i = 0; i < rows; i++) {
        const y = at[1] - d / 2 + (d * (i + 0.5)) / rows;
        const length = w * lengths[i % lengths.length];
        const gap = item.split === false ? 0 : length * 0.18;
        const x0 = at[0] - w / 2;
        line([[x0, y, at[2]], [x0 + length - gap * 1.6, y, at[2]]], stroke, { layer: item.layer ?? 0.5 });
        if (gap) line([[x0 + length - gap, y, at[2]], [x0 + length, y, at[2]]], stroke, { layer: item.layer ?? 0.5 });
      }
    },

    // Mono uppercase text at a point. Use it sparingly: the source art has none.
    label(item) {
      const at = item.at ?? [0, 0, 0];
      const e = 0.05;
      add({ kind: "label", pts: [at], bbox: bboxOf([[at[0] - e, at[1] - e, at[2] - e], [at[0] + e, at[1] + e, at[2] + e]]), text: String(item.text ?? ""), color: item.accent === true ? "accent" : item.tone ?? "ink", alpha: item.opacity ?? 0.6, size: item.fontSize ?? 11, anchor: item.anchor ?? "middle", plane: item.plane ?? "screen", offset: item.offset ?? [0, -8], layer: item.layer ?? 1, noFit: item.fit !== true });
    },
  };

  function rounded(points, radius) {
    const out = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const [p, c, q] = [points[i - 1], points[i], points[i + 1]];
      const inLen = Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]);
      const outLen = Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2]);
      const r = Math.min(radius, inLen / 2, outLen / 2);
      const a = [0, 1, 2].map(j => c[j] + ((p[j] - c[j]) / inLen) * r);
      const b = [0, 1, 2].map(j => c[j] + ((q[j] - c[j]) / outLen) * r);
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        out.push([0, 1, 2].map(j => (1 - t) ** 2 * a[j] + 2 * (1 - t) * t * c[j] + t ** 2 * b[j]));
      }
    }
    out.push(points.at(-1));
    return out;
  }

  return { fragments, handlers };
}

const normAnim = anim => (typeof anim === "string" ? { type: anim } : anim ?? null);
const shift = (item, by) => ({ ...item, at: [(item.at?.[0] ?? 0) + by[0], (item.at?.[1] ?? 0) + by[1], (item.at?.[2] ?? 0) + (by[2] ?? 0)] });
const picks = (accent, index) => accent !== undefined && accent !== false && [].concat(accent).includes(index);

// Composite items expand into plain ones. They nest.
function expand(items, origin = [0, 0, 0]) {
  const out = [];
  for (const raw of items ?? []) {
    if (!raw) continue;
    const item = origin.some(Boolean) && raw.type !== "link" && raw.type !== "line" ? shift(raw, origin) : raw;
    const at = item.at ?? [0, 0, 0];
    switch (item.type) {
      case "group":
        out.push(...expand(item.items, at));
        break;
      // Copies of one item spaced up the z axis: an exploded view.
      case "stack": {
        const count = item.count ?? 3;
        const height = item.item.size?.[2] ?? item.item.height ?? 0;
        for (let i = 0; i < count; i++) {
          const copy = { ...item.item, ...(picks(item.accent, i) ? { accent: true } : {}), ...(item.each?.(i) ?? {}) };
          if (item.fade && !picks(item.accent, i)) copy.opacity = lerp(item.fade, 1, count === 1 ? 1 : i / (count - 1)) * (copy.opacity ?? 1);
          if (item.animate) copy.animate = { type: "float", amp: (item.spread ?? 0.12) * (i + 1), delay: i * 0.14, ...normAnim(item.animate), type: "float" };
          out.push(...expand([copy], [at[0], at[1], at[2] + i * (height + (item.gap ?? 0.4))]));
        }
        break;
      }
      // Copies on a rectangular lattice on the ground.
      case "array": {
        const [nx, ny = nx] = [].concat(item.count ?? 3);
        const [sx, sy = sx] = [].concat(item.step ?? 1.5);
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const index = j * nx + i;
          if ([].concat(item.skip ?? []).includes(index)) continue;
          const copy = { ...item.item, ...(picks(item.accent, index) ? { accent: true } : {}), ...(item.each?.(i, j, index) ?? {}) };
          if (item.heights) { copy.size = [...(copy.size ?? [1, 1, 1])]; copy.size[2] = item.heights[index % item.heights.length]; }
          out.push(...expand([copy], [at[0] + (i - (nx - 1) / 2) * sx, at[1] + (j - (ny - 1) / 2) * sy, at[2]]));
        }
        break;
      }
      // Copies around a circle, optionally joined to each other and the centre.
      case "orbit": {
        const count = item.count ?? 6;
        const r = item.radius ?? 3;
        const spots = Array.from({ length: count }, (_, i) => { const t = rad(item.turn ?? 0) + (TAU * i) / count; return [at[0] + r * Math.cos(t), at[1] + r * Math.sin(t), at[2]]; });
        const lift = item.lift ?? 0;
        if (item.ring !== false) out.push({ type: "line", points: spots.map(p => [p[0], p[1], p[2] + lift]), closed: true, opacity: item.linkOpacity ?? 0.3, layer: item.linkLayer ?? -0.5 });
        if (item.spokes) for (const p of spots) out.push({ type: "line", points: [[at[0], at[1], at[2] + lift], [p[0], p[1], p[2] + lift]], opacity: item.linkOpacity ?? 0.3, layer: item.linkLayer ?? -0.5, fade: item.spokes === "fade" ? "start" : undefined });
        spots.forEach((p, i) => {
          const variant = item.items ? item.items[i % item.items.length] : item.item;
          out.push(...expand([{ ...variant, ...(picks(item.accent, i) ? { accent: true } : {}), ...(item.each?.(i) ?? {}) }], p));
        });
        break;
      }
      // Copies along x that grow taller: steps, or a bar chart.
      case "steps": {
        const count = item.count ?? 5;
        const step = item.step ?? 1.2;
        for (let i = 0; i < count; i++) {
          const copy = { type: "box", material: "glass", ...item.item, ...(picks(item.accent, i) ? { accent: true } : {}) };
          copy.size = [...(copy.size ?? [0.9, 0.9, 1])];
          copy.size[2] = item.heights ? item.heights[i] : (item.base ?? 0.5) + i * (item.rise ?? 0.5);
          const along = (i - (count - 1) / 2) * step;
          out.push(...expand([copy], item.axis === "y" ? [at[0], at[1] + along, at[2]] : [at[0] + along, at[1], at[2]]));
        }
        break;
      }
      default:
        out.push(item);
    }
  }
  return out;
}

// Turn a scene into ordered fragments with screen coordinates.
export function build(spec) {
  const scene = { ...DEFAULTS, ...spec };
  const { fragments, handlers } = builder(scene);
  for (const item of expand(scene.items)) {
    const handler = handlers[item.type];
    if (!handler) throw new Error(`iso: unknown item type "${item.type}"`);
    handler(item);
  }

  // Fit: find the scale and origin that place the content in the frame.
  const unit = fragments.map(frag => frag.pts.map(p => project(p, scene.angle)));
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  fragments.forEach((frag, i) => {
    if (frag.noFit) return;
    const grow = frag.kind === "sphere" || frag.kind === "dome" ? frag.radius * Math.SQRT2 * Math.cos(rad(scene.angle)) : 0;
    for (const [x, y] of unit[i]) {
      x0 = Math.min(x0, x - grow); x1 = Math.max(x1, x + grow);
      y0 = Math.min(y0, y - grow); y1 = Math.max(y1, y + (frag.kind === "dome" ? 0 : grow));
    }
  });
  if (!Number.isFinite(x0)) [x0, y0, x1, y1] = [-1, -1, 1, 1];
  const pad = scene.padding;
  const scale = scene.scale ?? Math.min((scene.width - pad * 2) / Math.max(x1 - x0, 1e-6), (scene.height - pad * 2) / Math.max(y1 - y0, 1e-6));
  const ox = scene.origin?.[0] ?? scene.width / 2 - ((x0 + x1) / 2) * scale + (scene.offset?.[0] ?? 0);
  const oy = scene.origin?.[1] ?? (scene.align === "bottom" ? scene.height - pad - y1 * scale : scene.align === "top" ? pad - y0 * scale : scene.height / 2 - ((y0 + y1) / 2) * scale) + (scene.offset?.[1] ?? 0);

  let [d0, d1] = [Infinity, -Infinity];
  fragments.forEach((frag, i) => {
    frag.screen = unit[i].map(([x, y]) => [ox + x * scale, oy + y * scale]);
    const grow = (frag.kind === "sphere" || frag.kind === "dome" || frag.kind === "glow" ? frag.radius * 1.3 * scale : 2);
    const xs = frag.screen.map(p => p[0]);
    const ys = frag.screen.map(p => p[1]);
    frag.rect = [Math.min(...xs) - grow, Math.min(...ys) - grow, Math.max(...xs) + grow, Math.max(...ys) + grow];
    if (frag.layer >= 0 && frag.kind !== "glow") { d0 = Math.min(d0, frag.depth); d1 = Math.max(d1, frag.depth); }
  });
  for (const frag of fragments) {
    const t = d1 > d0 ? clamp01((frag.depth - d0) / (d1 - d0)) : 1;
    frag.near = frag.layer < 0 ? 1 : lerp(1 - scene.depthFade, 1, t);
  }
  return { scene, scale, origin: [ox, oy], fragments: sortFragments(fragments) };
}

/* ------------------------------------------------------------------ SVG */

const COLORS = { ink: "currentColor", accent: "var(--iso-accent)", sage: "var(--iso-sage)", bg: "var(--iso-bg)" };
const paint = name => COLORS[name] ?? name;

const THEMES = {
  dark: { ink: "#ffffff", bg: "#000000", accent: "#c7ff9f", sage: "#83a36f" },
  light: { ink: "#000000", bg: "#ffffff", accent: "#000000", sage: "#4d7a2a" },
  lime: { ink: "#000000", bg: "#c7ff9f", accent: "#000000", sage: "#3f6b22" },
};

const STYLE = `
.iso-f{stroke:none}.iso-l{fill:none;stroke-linecap:round;stroke-linejoin:round}
.iso-t{font:400 11px "Fragment Mono",ui-monospace,monospace;letter-spacing:.04em;text-transform:uppercase}
@media (prefers-reduced-motion:no-preference){
.iso-float{animation:iso-float var(--d,5s) cubic-bezier(.65,0,.29,1) var(--w,0s) infinite}
.iso-pulse{animation:iso-pulse var(--d,5s) ease-in-out var(--w,0s) infinite}
.iso-march{animation:iso-march var(--d,5s) linear infinite}
.iso-travel{animation:iso-travel var(--d,5s) linear var(--w,0s) infinite}
}
@keyframes iso-float{0%,92%,100%{transform:translateY(0)}40%,46%{transform:translateY(var(--a,-10px))}}
@keyframes iso-pulse{0%,100%{opacity:var(--lo,.35)}50%{opacity:1}}
@keyframes iso-march{to{stroke-dashoffset:var(--m,-44px)}}
@keyframes iso-travel{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}`.replace(/\n/g, "");

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return "i" + (h >>> 0).toString(36);
}

function animAttrs(anim, scale) {
  const a = normAnim(anim);
  if (!a) return "";
  const vars = [];
  if (a.duration) vars.push(`--d:${a.duration}s`);
  if (a.delay) vars.push(`--w:${num(a.delay)}s`);
  if (a.type === "float") vars.push(`--a:${num(-(a.amp ?? 0.25) * scale)}px`);
  if (a.type === "pulse" && a.low !== undefined) vars.push(`--lo:${a.low}`);
  return ` class="iso-${a.type}"${vars.length ? ` style="${vars.join(";")}"` : ""}`;
}

// Render a scene to an SVG string.
export function render(spec) {
  const { scene, scale, fragments } = build(spec);
  const theme = { ...THEMES[scene.theme ?? "dark"], ...(scene.colors ?? {}) };
  const onLight = (scene.theme ?? "dark") !== "dark";
  const id = scene.id ?? hash(JSON.stringify(spec, (key, value) => (typeof value === "function" ? value.toString() : value)));
  const defs = new Map();
  const gradient = (key, make) => {
    if (!defs.has(key)) defs.set(key, { id: `${id}g${defs.size}`, make });
    return `url(#${defs.get(key).id})`;
  };
  const body = [];

  const tintFill = (frag, pair, sweep, color) => {
    if (!pair) return null;
    const a = clamp01(pair[0] * frag.near * (frag.alpha ?? 1));
    const b = clamp01(pair[1] * frag.near * (frag.alpha ?? 1));
    if (Math.abs(a - b) < 0.005) return { fill: paint(color), opacity: a };
    const key = [color, num(a), num(b), sweep].join(",");
    return {
      fill: gradient(key, gid => `<linearGradient id="${gid}" x1="0" y1="0" x2="${sweep === "h" ? 1 : 0}" y2="${sweep === "h" ? 0 : 1}"><stop stop-color="${paint(color)}" stop-opacity="${num(a)}"/><stop offset="1" stop-color="${paint(color)}" stop-opacity="${num(b)}"/></linearGradient>`),
      opacity: 1,
    };
  };

  const strokeAttrs = (stroke, opacity) => {
    let out = ` stroke="${paint(stroke.color)}" stroke-width="${num(stroke.width)}"`;
    if (opacity < 0.995) out += ` stroke-opacity="${num(opacity)}"`;
    if (stroke.dash) out += ` stroke-dasharray="${stroke.dash.join(" ")}"`;
    return out;
  };

  for (let i = 0; i < fragments.length; i++) {
    const frag = fragments[i];
    const anim = animAttrs(frag.anim, scale);
    const path = pts => pts.map((p, k) => `${k ? "L" : "M"}${px(p[0])} ${px(p[1])}`).join("");

    if (frag.kind === "face") {
      const d = path(frag.screen) + "Z";
      if (frag.fill.base) body.push(`<path class="iso-f"${anim} d="${d}" fill="${paint("bg")}"/>`);
      const tint = tintFill(frag, frag.fill.pair, frag.fill.sweep, frag.fill.color);
      if (tint && (tint.opacity > 0.004)) body.push(`<path class="iso-f"${anim} d="${d}" fill="${tint.fill}"${tint.opacity < 0.995 ? ` fill-opacity="${num(tint.opacity)}"` : ""}/>`);
    } else if (frag.kind === "line") {
      // Join the pieces of one polyline that stayed adjacent.
      const pts = [frag.screen[0], frag.screen[1]];
      let opacity = frag.stroke.opacity * frag.fade * frag.near * (frag.alpha ?? 1);
      const first = frag;
      while (i + 1 < fragments.length) {
        const next = fragments[i + 1];
        if (next.kind !== "line" || next.chain !== frag.chain) break;
        const nextOpacity = next.stroke.opacity * next.fade * next.near * (next.alpha ?? 1);
        if (Math.abs(nextOpacity - opacity) > 0.05) break;
        const tail = pts.at(-1);
        const head = pts[0];
        const near = (p, q) => Math.abs(p[0] - q[0]) < 0.05 && Math.abs(p[1] - q[1]) < 0.05;
        if (near(next.screen[0], tail)) pts.push(next.screen[1]);
        else if (near(next.screen[1], head)) pts.unshift(next.screen[0]);
        else break;
        i++;
      }
      if (opacity < 0.012) continue;
      let extra = "";
      const a = normAnim(first.anim);
      if (first.stroke.dash && a?.type === "march") extra = ` class="iso-l iso-march" style="--m:${-(first.stroke.dash[0] + first.stroke.dash[1]) * 4}px${a.duration ? `;--d:${a.duration}s` : ""}"`;
      else if (a && a.type !== "march") extra = animAttrs(a, scale).replace('class="', 'class="iso-l ');
      body.push(`<path${extra || ' class="iso-l"'} d="${path(pts)}"${strokeAttrs(first.stroke, opacity)}/>`);
    } else if (frag.kind === "travel") {
      body.push(`<path class="iso-l iso-travel" pathLength="100" d="${path(frag.screen)}" stroke="${paint(frag.stroke.color)}" stroke-width="${num(frag.stroke.width)}" stroke-dasharray="3 97" stroke-dashoffset="${num(30 + ((frag.delay * 37) % 60))}" style="--w:${num(-frag.delay)}s${frag.duration ? `;--d:${frag.duration}s` : ""}"/>`);
    } else if (frag.kind === "glow") {
      const [cx, cy] = frag.screen[0];
      const rx = frag.radius * Math.SQRT2 * Math.cos(rad(scene.angle)) * scale;
      const ry = frag.radius * Math.SQRT2 * Math.sin(rad(scene.angle)) * scale;
      if (onLight) { frag.color = "sage"; frag.strength *= 0.45; }
      const fill = gradient(`glow,${frag.color},${num(frag.strength)}`, gid => `<radialGradient id="${gid}"><stop stop-color="${paint(frag.color)}" stop-opacity="${num(frag.strength)}"/><stop offset=".55" stop-color="${paint(frag.color)}" stop-opacity="${num(frag.strength * 0.28)}"/><stop offset="1" stop-color="${paint(frag.color)}" stop-opacity="0"/></radialGradient>`);
      body.push(`<ellipse${anim} cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(Math.max(ry, rx * 0.4))}" fill="${fill}"/>`);
    } else if (frag.kind === "sphere" || frag.kind === "dome") {
      const [cx, cy] = frag.screen[0];
      const r = frag.radius * Math.SQRT2 * Math.cos(rad(scene.angle)) * scale;
      const style = frag.style;
      const solidLook = frag.material === "solid" || frag.material === "panel";
      const stops = solidLook ? (onLight ? [[0, 0.02], [0.5, 0.16], [1, 0.42]] : [[0, 0.95], [0.45, 0.62], [1, 0.3]]) : [[0, 0.16], [0.6, 0.05], [1, 0.02]];
      const fill = frag.material === "wire" || frag.material === "ghost" ? "none" : gradient(`ball,${style.fill.color},${frag.material},${num(frag.near)}`, gid => `<radialGradient id="${gid}" cx=".42" cy=".28" r=".8">${stops.map(([o, v]) => `<stop offset="${o}" stop-color="${paint(style.fill.color === "sage" && solidLook ? "ink" : style.fill.color)}" stop-opacity="${num(v * (frag.alpha ?? 1))}"/>`).join("")}</radialGradient>`);
      if (frag.kind === "sphere") {
        if (solidLook) body.push(`<circle${anim} cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${paint("bg")}"/>`);
        body.push(`<circle${anim} cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${fill}"${style.stroke.opacity > 0 && (!solidLook || onLight) ? strokeAttrs(style.stroke, Math.max(style.stroke.opacity, 0.6) * (frag.alpha ?? 1)) : ""}/>`);
      } else {
        const ry = frag.radius * Math.SQRT2 * Math.sin(rad(scene.angle)) * scale;
        const d = `M${num(cx - r)} ${num(cy)}A${num(r)} ${num(r)} 0 0 1 ${num(cx + r)} ${num(cy)}A${num(r)} ${num(ry)} 0 0 1 ${num(cx - r)} ${num(cy)}Z`;
        if (fill !== "none") body.push(`<path class="iso-f"${anim} d="${d}" fill="${fill}"/>`);
        body.push(`<path class="iso-l"${anim} d="M${num(cx - r)} ${num(cy)}A${num(r)} ${num(r)} 0 0 1 ${num(cx + r)} ${num(cy)}"${strokeAttrs(style.stroke, Math.max(style.stroke.opacity, 0.4) * (frag.alpha ?? 1))}/>`);
      }
    } else if (frag.kind === "dot") {
      const [cx, cy] = frag.screen[0];
      if (frag.halo && !onLight) body.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(frag.radius * 4)}" fill="${gradient(`halo,${frag.color}`, gid => `<radialGradient id="${gid}"><stop stop-color="${paint(frag.color)}" stop-opacity=".55"/><stop offset="1" stop-color="${paint(frag.color)}" stop-opacity="0"/></radialGradient>`)}"${anim}/>`);
      body.push(`<circle${anim} cx="${num(cx)}" cy="${num(cy)}" r="${num(frag.radius)}" fill="${paint(frag.color)}"${frag.alpha < 1 ? ` fill-opacity="${num(frag.alpha)}"` : ""}/>`);
    } else if (frag.kind === "label") {
      const [cx, cy] = frag.screen[0];
      const a = rad(scene.angle);
      const matrix = frag.plane === "x" ? `matrix(${num(Math.cos(a))} ${num(Math.sin(a))} 0 1 ${num(cx)} ${num(cy)})`
        : frag.plane === "y" ? `matrix(${num(Math.cos(a))} ${num(-Math.sin(a))} 0 1 ${num(cx)} ${num(cy)})`
        : frag.plane === "top" ? `matrix(${num(Math.cos(a))} ${num(Math.sin(a))} ${num(-Math.cos(a))} ${num(Math.sin(a))} ${num(cx)} ${num(cy)})`
        : `translate(${num(cx + frag.offset[0])} ${num(cy + frag.offset[1])})`;
      body.push(`<text class="iso-t" transform="${matrix}" text-anchor="${frag.anchor}" font-size="${frag.size}" fill="${paint(frag.color)}" fill-opacity="${num(frag.alpha)}">${frag.text.replace(/[&<>]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch])}</text>`);
    }
  }

  const vars = `color:var(--iso-ink,${theme.ink});--iso-bg:var(--iso-surface,${scene.bg ?? theme.bg});--iso-accent:var(--iso-hot,${theme.accent});--iso-sage:var(--iso-soft,${theme.sage})`;
  const label = scene.label ? ` role="img" aria-label="${String(scene.label).replace(/"/g, "&quot;")}"` : ' aria-hidden="true"';
  const gradients = [...defs.values()].map(def => def.make(def.id)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" class="iso" viewBox="0 0 ${scene.width} ${scene.height}" fill="none" style="${vars}"${label}><style>${STYLE}</style>${gradients ? `<defs>${gradients}</defs>` : ""}${body.join("")}</svg>`;
}

/* ------------------------------------------------------------------ runtime */

// Put a scene into an element. Returns a function that re-renders with a new
// scene, for theme changes or data updates.
export function mount(el, spec) {
  const draw = next => { el.innerHTML = render(next); return draw; };
  return draw(spec);
}

// Re-render every frame for motion CSS cannot express, such as turning a solid
// in the ground plane. `frame(seconds)` returns a scene. It pauses off screen
// and when the tab is hidden, and draws one still frame under reduced motion.
export function play(el, frame, { still = 0 } = {}) {
  const quiet = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.innerHTML = render(frame(still));
  if (quiet) return () => {};
  let handle = 0;
  let visible = true;
  let start = 0;
  const tick = now => {
    handle = 0;
    start ||= now;
    el.innerHTML = render(frame((now - start) / 1000));
    schedule();
  };
  const schedule = () => { if (!handle && visible && !document.hidden) handle = requestAnimationFrame(tick); };
  const watch = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); else { cancelAnimationFrame(handle); handle = 0; } });
  watch.observe(el);
  const onHide = () => schedule();
  document.addEventListener("visibilitychange", onHide);
  schedule();
  return () => { cancelAnimationFrame(handle); watch.disconnect(); document.removeEventListener("visibilitychange", onHide); };
}
