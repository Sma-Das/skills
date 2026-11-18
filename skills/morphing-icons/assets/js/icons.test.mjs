import assert from "node:assert/strict";
import test from "node:test";
import {
  CENTER, HIDDEN, ICONS, createMorph, filmstrip, length, planLines, resolve, rotateLine, shortestTurn, simulate, toSVG, visibleLines,
  DEFAULT_SET, line,
} from "./icons.js";
import { audit, validate } from "../../scripts/audit.mjs";

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const shown = (name) => {
  const r = resolve(DEFAULT_SET, name);
  return r.lines.map(l => rotateLine(l, r.rotate));
};

test("every bundled icon passes validation and the audit flags nothing", () => {
  assert.deepEqual(validate(), []);
  const { errors, pairs } = audit();
  assert.deepEqual(errors, []);
  assert.equal(pairs.length, Object.keys(ICONS).length * (Object.keys(ICONS).length - 1));
  assert.deepEqual(pairs.filter(p => p.flags.length).map(p => `${p.from}→${p.to}: ${p.flags}`), []);
});

test("validation catches broken icons", () => {
  const icons = {
    two: { lines: [line(2, 7, 12, 7), line(7, 2, 7, 12)] },
    stray: { lines: [line(2, 7, 12, 7), [3, 3, 3, 3, 0], HIDDEN] },
    edge: { lines: [line(0, 7, 14, 7), HIDDEN, HIDDEN] },
    orphan: { group: "nope" },
  };
  const errors = validate({ icons, groups: {} });
  assert.ok(errors.some(e => e.startsWith("two:")));
  assert.ok(errors.some(e => e.startsWith("stray:")));
  assert.ok(errors.some(e => e.startsWith("edge:")));
  assert.ok(errors.some(e => e.includes("unknown group")));
});

test("shortestTurn respects symmetry and turns clockwise on a tie", () => {
  assert.equal(shortestTurn(0, 90), 90);
  assert.equal(shortestTurn(0, -90), -90);
  assert.equal(shortestTurn(0, 180), 180);
  assert.equal(shortestTurn(0, 45, 90), 45);
  assert.equal(shortestTurn(45, 0, 90), 45); // cross → plus keeps turning the same way
  assert.equal(shortestTurn(720, 0), 0);
});

test("same-group transitions only rotate: line lengths never change", () => {
  const frames = simulate("arrow-right", "arrow-down");
  const base = frames[0].lines.map(length);
  for (const f of frames) f.lines.forEach((l, i) => close(length(l), base[i]));
  close(frames.at(-1).angle, 90, 1e-9);
});

test("cross-group transitions bake rotation instead of spinning", () => {
  const frames = simulate("arrow-down", "menu");
  for (const f of frames.slice(1, -1)) assert.equal(f.angle, 0);
  assert.deepEqual(frames.at(-1).lines, ICONS.menu.lines);
});

// Compare drawings as unordered sets of visible segments: a plus turned 90° is still a plus.
const drawing = lines => lines.filter(l => l[4] > 0.5)
  .map(l => { const a = [l[0], l[1]].map(n => n.toFixed(4)), b = [l[2], l[3]].map(n => n.toFixed(4)); return [a, b].sort().join(" "); })
  .sort();

test("every transition ends on the target drawing", () => {
  for (const a of Object.keys(ICONS)) {
    for (const b of Object.keys(ICONS)) {
      if (a !== b) assert.deepEqual(drawing(visibleLines(simulate(a, b).at(-1))), drawing(shown(b)), `${a}→${b}`);
    }
  }
});

test("planLines matches lines by least travel and grows new lines in place", () => {
  const plan = planLines(ICONS.menu.lines, ICONS.minus.lines);
  // The middle bar becomes the minus; the outer bars shrink into their own midpoints.
  assert.deepEqual(plan.end[1], [2, 7, 12, 7, 1]);
  assert.deepEqual(plan.end[0], [7, 3.5, 7, 3.5, 0]);
  assert.deepEqual(plan.end[2], [7, 10.5, 7, 10.5, 0]);
  const grow = planLines(ICONS.minus.lines, shown("plus"));
  const appearing = grow.end.findIndex((l, i) => l[4] === 1 && grow.start[i][4] === 0);
  assert.ok(appearing >= 0);
  const s = grow.start[appearing];
  assert.deepEqual([s[0], s[1], s[2], s[3]], [CENTER, CENTER, CENTER, CENTER]);
});

test("planLines flips a line rather than swinging it end over end", () => {
  const plan = planLines([line(2, 7, 12, 7), HIDDEN, HIDDEN], [line(12, 7, 2, 7), HIDDEN, HIDDEN]);
  assert.deepEqual(plan.end[0], [2, 7, 12, 7, 1]);
  assert.equal(plan.cost, 0);
});

test("interrupting keeps continuity: no frame jumps", () => {
  const morph = createMorph("menu");
  morph.to("cross");
  for (let i = 0; i < 6; i++) morph.step(1 / 60);
  const before = visibleLines(morph.frame());
  morph.to("arrow-down");
  const after = visibleLines(morph.frame());
  // Retargeting may re-seat invisible lines, but every visible line stays where it was drawn.
  before.forEach((l, i) => { if (l[4] > 0.05) l.forEach((n, k) => close(after[i][k], n, 1e-9)); });
  while (morph.step(1 / 60));
  assert.equal(morph.icon, "arrow-down");
  close(morph.frame().angle, 90, 1e-9);
});

test("interrupting a rotation continues from the current angle", () => {
  const morph = createMorph("arrow-right");
  morph.to("arrow-down");
  for (let i = 0; i < 5; i++) morph.step(1 / 60);
  const mid = morph.frame().angle;
  assert.ok(mid > 0 && mid < 90);
  morph.to("arrow-left");
  assert.equal(morph.frame().angle, mid);
  while (morph.step(1 / 60));
  close(morph.frame().angle, 180, 1e-9);
});

test("more and grip are one row of dots turned 90°", () => {
  const frames = simulate("more", "grip");
  for (const f of frames) assert.deepEqual(f.lines, DEFAULT_SET.groups.dots.lines);
  close(frames.at(-1).angle, 90, 1e-9);
});

test("instant transitions land immediately for reduced motion", () => {
  const morph = createMorph("play");
  morph.to("pause", { instant: true });
  assert.equal(morph.step(1 / 60), false);
  assert.deepEqual(morph.frame().lines, ICONS.pause.lines);
});

test("transitions settle quickly and finish visually well before rest", () => {
  for (const [a, b] of [["menu", "cross"], ["arrow-right", "arrow-left"], ["play", "pause"]]) {
    const frames = simulate(a, b);
    assert.ok(frames.length < 60, `${a}→${b} took ${frames.length} frames`);
    const strip = filmstrip(a, b, { count: 5 });
    assert.ok(strip.at(-1).ms <= 450, `${a}→${b} visually done at ${strip.at(-1).ms}ms`);
  }
});

test("custom icon sets plug in", () => {
  const icons = { ...ICONS, slash: { lines: [line(3.5, 10.5, 10.5, 3.5), HIDDEN, HIDDEN] } };
  const end = simulate("menu", "slash", { icons }).at(-1);
  assert.deepEqual(end.lines, icons.slash.lines);
  assert.deepEqual(validate({ icons, groups: DEFAULT_SET.groups }), []);
});

test("toSVG renders accessible markup", () => {
  const hidden = toSVG(createMorph("menu").frame());
  assert.match(hidden, /aria-hidden="true"/);
  assert.equal((hidden.match(/<line /g) ?? []).length, 3);
  assert.match(toSVG(createMorph("menu").frame(), { label: `Menu "main"` }), /role="img" aria-label="Menu &quot;main&quot;"/);
});
