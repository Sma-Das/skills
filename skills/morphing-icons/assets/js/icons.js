// Three-line morphing icons: icon data, transition planning, and a spring engine.
// Pure ES module with no DOM access and no dependencies, so it runs in browsers, workers, and Node.
//
// Every icon is exactly three lines in a 14×14 box. A line is [x1, y1, x2, y2, opacity].
// Icons that need fewer lines park the extras as HIDDEN: a point at the centre with opacity 0.
// Icons that are one shape at different angles share a group and change by rotation only.

export const SIZE = 14;
export const CENTER = SIZE / 2;
export const HIDDEN = Object.freeze([CENTER, CENTER, CENTER, CENTER, 0]);

export const line = (x1, y1, x2, y2) => [x1, y1, x2, y2, 1];
export const dot = (x, y) => [x, y, x, y, 1];
/** A line through the centre at `deg` from vertical, `length` long. */
export const spoke = (deg, length = 10) => {
  const r = (deg * Math.PI) / 180, dx = Math.sin(r) * length / 2, dy = -Math.cos(r) * length / 2;
  return [round(CENTER + dx), round(CENTER + dy), round(CENTER - dx), round(CENTER - dy), 1];
};
const round = n => Math.round(n * 1000) / 1000;

// A group is one drawing plus the rotations it appears at. `symmetry` is the angle after which the
// drawing looks identical (90 for a plus), so the engine never turns further than it has to.
export const GROUPS = {
  arrow: { symmetry: 360, lines: [line(2, 7, 12, 7), line(8, 3, 12, 7), line(8, 11, 12, 7)] },
  chevron: { symmetry: 360, lines: [line(4.75, 2.5, 9.25, 7), line(4.75, 11.5, 9.25, 7), HIDDEN] },
  plus: { symmetry: 90, lines: [line(2, 7, 12, 7), HIDDEN, line(7, 2, 7, 12)] },
  dots: { symmetry: 180, lines: [dot(2.5, 7), dot(7, 7), dot(11.5, 7)] },
};

// Rotation is SVG rotation: positive turns clockwise on screen. Base drawings point right.
export const ICONS = {
  menu: { lines: [line(2, 3.5, 12, 3.5), line(2, 7, 12, 7), line(2, 10.5, 12, 10.5)] },
  plus: { group: "plus", rotate: 0 },
  cross: { group: "plus", rotate: 45 },
  minus: { lines: [line(2, 7, 12, 7), HIDDEN, HIDDEN] },
  equals: { lines: [line(2, 5, 12, 5), HIDDEN, line(2, 9, 12, 9)] },
  asterisk: { lines: [spoke(0), spoke(60), spoke(120)] },
  more: { group: "dots", rotate: 0 },
  grip: { group: "dots", rotate: 90 },
  check: { lines: [line(2.5, 7.5, 5.5, 10.5), line(5.5, 10.5, 11.5, 3.5), HIDDEN] },
  play: { lines: [line(4.5, 2.5, 4.5, 11.5), line(4.5, 11.5, 12, 7), line(12, 7, 4.5, 2.5)] },
  pause: { lines: [line(4.5, 2.5, 4.5, 11.5), HIDDEN, line(9.5, 2.5, 9.5, 11.5)] },
  download: { lines: [line(3.5, 3.5, 7, 7), line(10.5, 3.5, 7, 7), line(2.5, 10.5, 11.5, 10.5)] },
  upload: { lines: [line(3.5, 7, 7, 3.5), line(10.5, 7, 7, 3.5), line(2.5, 10.5, 11.5, 10.5)] },
  external: { group: "arrow", rotate: -45 },
  "arrow-right": { group: "arrow", rotate: 0 },
  "arrow-down": { group: "arrow", rotate: 90 },
  "arrow-left": { group: "arrow", rotate: 180 },
  "arrow-up": { group: "arrow", rotate: -90 },
  "chevron-right": { group: "chevron", rotate: 0 },
  "chevron-down": { group: "chevron", rotate: 90 },
  "chevron-left": { group: "chevron", rotate: 180 },
  "chevron-up": { group: "chevron", rotate: -90 },
};

export const DEFAULT_SET = Object.freeze({ icons: ICONS, groups: GROUPS });

/** Normalise an icon to { name, group, rotate, symmetry, lines }. Ungrouped icons are their own group. */
export function resolve(set, name) {
  const icon = set.icons[name];
  if (!icon) throw new Error(`Unknown icon "${name}"`);
  if (icon.group) {
    const group = set.groups[icon.group];
    if (!group) throw new Error(`Icon "${name}" names unknown group "${icon.group}"`);
    return { name, group: icon.group, rotate: icon.rotate ?? 0, symmetry: group.symmetry ?? 360, lines: group.lines };
  }
  return { name, group: `icon:${name}`, rotate: 0, symmetry: 360, lines: icon.lines };
}

export const isVisible = l => l[4] > 0.01;
export const length = l => Math.hypot(l[2] - l[0], l[3] - l[1]);
const midpoint = (l, opacity) => {
  const x = (l[0] + l[2]) / 2, y = (l[1] + l[3]) / 2;
  return [x, y, x, y, opacity];
};

export function rotatePoint(x, y, deg) {
  if (!deg) return [x, y];
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const dx = x - CENTER, dy = y - CENTER;
  return [CENTER + dx * c - dy * s, CENTER + dx * s + dy * c];
}

export function rotateLine(l, deg) {
  const [x1, y1] = rotatePoint(l[0], l[1], deg), [x2, y2] = rotatePoint(l[2], l[3], deg);
  return [x1, y1, x2, y2, l[4]];
}

/** Signed turn from `from` to `to` degrees, shortest modulo `symmetry`. A tie turns clockwise. */
export function shortestTurn(from, to, symmetry = 360) {
  let d = (((to - from) % symmetry) + symmetry) % symmetry;
  if (d > symmetry / 2 + 1e-9) d -= symmetry;
  return d;
}

const PERMUTATIONS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const flip = l => [l[2], l[3], l[0], l[1], l[4]];
const sq = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;

function pairCost(a, b) {
  const av = isVisible(a), bv = isVisible(b);
  if (!av && !bv) return { cost: 0, end: b };
  if (av && !bv) return { cost: length(a) ** 2 / 2, end: midpoint(a, 0) };
  if (!av && bv) return { cost: length(b) ** 2 / 2, end: b };
  const straight = sq(a[0], a[1], b[0], b[1]) + sq(a[2], a[3], b[2], b[3]);
  const flipped = sq(a[0], a[1], b[2], b[3]) + sq(a[2], a[3], b[0], b[1]);
  return flipped < straight ? { cost: flipped, end: flip(b) } : { cost: straight, end: b };
}

/**
 * Decide which current line becomes which target line, and which way round, so endpoints travel
 * the least. Lines that appear grow from their own midpoint; lines that vanish shrink into theirs.
 * Both inputs must be in the same frame (rotation already applied). Returns per-slot start and end.
 */
export function planLines(from, to) {
  let best = null;
  for (const p of PERMUTATIONS) {
    let cost = 0;
    const pairs = p.map((j, i) => pairCost(from[i], to[j]));
    for (const pair of pairs) cost += pair.cost;
    if (!best || cost < best.cost - 1e-9) best = { cost, pairs, permutation: p };
  }
  const start = from.map((a, i) => (isVisible(a) ? a.slice() : midpoint(best.pairs[i].end, a[4])));
  return { start, end: best.pairs.map(pair => pair.end.slice()), permutation: best.permutation, cost: best.cost };
}

// Close to critically damped: quick, no overshoot, and velocity carries through interruptions.
export const SPRING = Object.freeze({ stiffness: 320, damping: 36, mass: 1, restDelta: 0.01, restSpeed: 0.05 });
const STEP = 1 / 240;
const ANGLE = 15;
const DEG = Math.PI / 180;

/**
 * A morphing icon's state machine. `to(name)` retargets; `step(seconds)` advances and returns
 * whether it is still moving; `frame()` returns { lines, angle } to draw inside
 * `rotate(angle 7 7)`. Call `to(name, { instant: true })` for reduced motion.
 */
export function createMorph(initial, options = {}) {
  const set = { icons: options.icons ?? ICONS, groups: options.groups ?? GROUPS };
  const spring = { ...SPRING, ...options.spring };
  const pos = new Float64Array(16), vel = new Float64Array(16), tgt = new Float64Array(16);
  let target = resolve(set, initial);
  let frameGroup = target.group; // the group whose drawing pos holds, or null while baked
  let pending = null; // icon to settle into after a coordinate morph

  const write = (arr, lines, angle) => {
    lines.forEach((l, i) => arr.set(l, i * 5));
    arr[ANGLE] = angle;
  };
  const readLines = arr => [0, 1, 2].map(i => Array.from(arr.subarray(i * 5, i * 5 + 5)));
  const settle = icon => {
    write(pos, icon.lines, icon.rotate);
    tgt.set(pos);
    vel.fill(0);
    frameGroup = icon.group;
    pending = null;
  };
  settle(target);

  function to(name, { instant = false } = {}) {
    const next = resolve(set, name);
    const changed = next.name !== target.name;
    target = next;
    if (instant) return settle(next);
    if (!changed) return;
    if (frameGroup === next.group) {
      tgt[ANGLE] = pos[ANGLE] + shortestTurn(pos[ANGLE], next.rotate, next.symmetry);
      return;
    }
    // Bake the current rotation into the coordinates so a morph never also spins.
    const angle = pos[ANGLE], omega = vel[ANGLE] * DEG;
    for (let i = 0; i < 3; i++) {
      for (const k of [0, 2]) {
        const o = i * 5 + k, x = pos[o], y = pos[o + 1];
        const [rx, ry] = rotatePoint(x, y, angle);
        const [vx, vy] = rotatePoint(CENTER + vel[o], CENTER + vel[o + 1], angle);
        pos[o] = rx; pos[o + 1] = ry;
        vel[o] = vx - CENTER - omega * (ry - CENTER);
        vel[o + 1] = vy - CENTER + omega * (rx - CENTER);
      }
    }
    pos[ANGLE] = 0; vel[ANGLE] = 0;
    const plan = planLines(readLines(pos), next.lines.map(l => rotateLine(l, next.rotate)));
    write(pos, plan.start, 0);
    write(tgt, plan.end, 0);
    frameGroup = null;
    pending = next;
  }

  function step(seconds) {
    const { stiffness: k, damping: c, mass: m, restDelta, restSpeed } = spring;
    let remaining = Math.min(seconds, 0.1);
    while (remaining > 1e-9) {
      const h = Math.min(STEP, remaining);
      remaining -= h;
      for (let i = 0; i < 16; i++) {
        vel[i] += ((-k * (pos[i] - tgt[i]) - c * vel[i]) / m) * h;
        pos[i] += vel[i] * h;
      }
    }
    for (let i = 0; i < 16; i++) {
      const scale = i === ANGLE ? 10 : 1;
      if (Math.abs(pos[i] - tgt[i]) > restDelta * scale || Math.abs(vel[i]) > restSpeed * scale) return true;
    }
    pos.set(tgt); vel.fill(0);
    if (pending) settle(pending);
    return false;
  }

  const frame = () => ({
    lines: readLines(pos).map(l => [l[0], l[1], l[2], l[3], Math.min(1, Math.max(0, l[4]))]),
    angle: pos[ANGLE],
  });

  return {
    to, step, frame,
    get icon() { return target.name; },
    get moving() { return pending !== null || pos.some((v, i) => v !== tgt[i]); },
  };
}

/** The lines as they appear on screen, with the frame's rotation applied. */
export const visibleLines = frame => frame.lines.map(l => rotateLine(l, frame.angle));

/** Run a transition to rest and return every frame, for filmstrips, audits, and tests. */
export function simulate(from, to, { fps = 60, maxFrames = 300, ...options } = {}) {
  const morph = createMorph(from, options);
  const frames = [morph.frame()];
  morph.to(to);
  for (let i = 0; i < maxFrames; i++) {
    const moving = morph.step(1 / fps);
    frames.push(morph.frame());
    if (!moving) break;
  }
  return frames;
}

/**
 * Pick `count` evenly spaced frames from the start of a transition until it is visually finished
 * (every endpoint within 0.1 units of where it lands), rather than until the spring is at rest.
 * Returns [{ frame, ms }].
 */
export function filmstrip(from, to, { count = 8, fps = 60, ...options } = {}) {
  const frames = simulate(from, to, { fps, ...options });
  const done = visualEnd(frames);
  return Array.from({ length: count }, (_, i) => {
    const f = Math.round((i / (count - 1)) * done);
    return { frame: frames[f], ms: Math.round((f * 1000) / fps) };
  });
}

/** Index of the first frame where every visible endpoint is within 0.1 units of where it lands. */
export function visualEnd(frames) {
  const shown = frames.map(visibleLines);
  const end = shown.at(-1);
  // The final frame may re-seat lines in a new slot order, so compare against the nearest end line.
  const gapTo = (l, e) => Math.max(Math.hypot(l[0] - e[0], l[1] - e[1]), Math.hypot(l[2] - e[2], l[3] - e[3])) + Math.abs(l[4] - e[4]) * 2;
  const near = l => Math.min(...end.map(e => gapTo(l, e)), ...end.map(e => gapTo(l, [e[2], e[3], e[0], e[1], e[4]])));
  const done = shown.findIndex(lines => lines.every(l => l[4] < 0.05 || near(l) < 0.1));
  return done < 1 ? frames.length - 1 : done;
}

/** Static SVG markup for one frame, for server rendering, filmstrips, and previews. */
export function toSVG(frame, { size = 24, strokeWidth = 1.5, color = "currentColor", label } = {}) {
  const a11y = label ? `role="img" aria-label="${escape(label)}"` : `aria-hidden="true"`;
  const lines = frame.lines
    .map(l => {
      const x2 = l[0] === l[2] && l[1] === l[3] ? l[2] + 0.001 : l[2];
      return `<line x1="${fmt(l[0])}" y1="${fmt(l[1])}" x2="${fmt(x2)}" y2="${fmt(l[3])}" opacity="${fmt(l[4])}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" ${a11y}><g transform="rotate(${fmt(frame.angle)} ${CENTER} ${CENTER})">${lines}</g></svg>`;
}

const fmt = n => String(Math.round(n * 1000) / 1000);
const escape = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
