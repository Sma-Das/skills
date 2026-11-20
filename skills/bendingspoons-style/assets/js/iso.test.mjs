import assert from "node:assert/strict";
import { test } from "node:test";
import { behind, build, depthOf, project, render, sortFragments } from "./iso.js";
import { scenes } from "./iso-scenes.js";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);

test("projection: 30 degree axes, equal unit lengths, z straight up", () => {
  const [xx, xy] = project([1, 0, 0]);
  const [yx, yy] = project([0, 1, 0]);
  close(xx, Math.cos(Math.PI / 6)); close(xy, 0.5);
  close(yx, -Math.cos(Math.PI / 6)); close(yy, 0.5);
  close(Math.hypot(xx, xy), 1); close(Math.hypot(yx, yy), 1);
  assert.deepEqual(project([0, 0, 1]), [0, -1]);
  assert.deepEqual(project([0, 0, 0]), [0, 0]);
});

test("projection: a ground square becomes a diamond sqrt(3) times wider than tall", () => {
  const pts = [[1, 1, 0], [-1, 1, 0], [-1, -1, 0], [1, -1, 0]].map(p => project(p));
  const width = Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0]));
  const height = Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]));
  close(width / height, Math.sqrt(3));
});

test("projection: the angle option flattens the ground and is linear", () => {
  const [, y30] = project([1, 1, 0], 30);
  const [, y15] = project([1, 1, 0], 15);
  assert.ok(y15 < y30);
  const a = project([2, 3, 4], 22);
  const b = project([1, -1, 0.5], 22);
  const sum = project([3, 2, 4.5], 22);
  close(a[0] + b[0], sum[0]); close(a[1] + b[1], sum[1]);
});

test("depth: grows toward the viewer on every axis and is constant along the view direction", () => {
  assert.ok(depthOf([1, 0, 0]) > depthOf([0, 0, 0]));
  assert.ok(depthOf([0, 1, 0]) > depthOf([0, 0, 0]));
  assert.ok(depthOf([0, 0, 1]) > depthOf([0, 0, 0]));
  // Two points on one line of sight land on the same pixel.
  for (const angle of [15, 30, 40]) {
    const k = 2 * Math.sin((angle * Math.PI) / 180);
    const p = project([0.3, -1, 2], angle);
    const q = project([0.3 + 1, -1 + 1, 2 + k], angle);
    close(p[0], q[0]); close(p[1], q[1]);
  }
});

const box = (min, max, extra = {}) => ({ kind: "face", bbox: { min, max }, layer: 0, depth: (min[0] + max[0] + min[1] + max[1] + min[2] + max[2]) / 2, rect: [0, 0, 1, 1], ...extra });

test("behind: a separating axis decides, overlap does not", () => {
  const a = box([0, 0, 0], [1, 1, 1]);
  assert.equal(behind(a, box([1, 0, 0], [2, 1, 1])), 1);      // lower x is farther
  assert.equal(behind(a, box([0, 1, 0], [1, 2, 1])), 1);      // lower y is farther
  assert.equal(behind(a, box([0, 0, 1], [1, 1, 2])), 1);      // lower z is underneath
  assert.equal(behind(box([1, 0, 0], [2, 1, 1]), a), -1);
  assert.equal(behind(a, box([0.5, 0.5, 0.5], [1.5, 1.5, 1.5])), 0);
  assert.equal(behind(box([0, 0, 0], [1, 1, 1]), box([1, 1, -2], [2, 2, -1])), 0);   // axes disagree
});

test("sort: far before near, whatever the input order", () => {
  const far = box([0, 0, 0], [1, 1, 1], { name: "far" });
  const mid = box([1, 0, 0], [2, 1, 1], { name: "mid" });
  const near = box([2, 0, 0], [3, 1, 1], { name: "near" });
  for (const input of [[far, mid, near], [near, mid, far], [mid, near, far]]) {
    assert.deepEqual(sortFragments(input).map(f => f.name), ["far", "mid", "near"]);
  }
});

test("sort: a big floor goes under a small box at its far corner, despite centre depth", () => {
  const floor = box([-5, -5, 0], [5, 5, 0], { name: "floor" });
  const corner = box([-5, -5, 0], [-4, -4, 1], { name: "box" });
  assert.ok(corner.depth < floor.depth);
  assert.deepEqual(sortFragments([corner, floor]).map(f => f.name), ["floor", "box"]);
});

test("sort: layers win over depth, and non-overlapping pieces of one line stay together", () => {
  const top = box([-9, -9, 0], [-8, -8, 1], { name: "top", layer: 1 });
  const base = box([5, 5, 5], [6, 6, 6], { name: "base", layer: 0 });
  assert.deepEqual(sortFragments([top, base]).map(f => f.name), ["base", "top"]);
  const piece = (seq, depth) => ({ kind: "line", chain: 7, seq, depth, layer: 0, bbox: { min: [seq, 0, 0], max: [seq + 1, 0, 0] }, rect: [seq * 10, 0, seq * 10 + 10, 1], name: "p" + seq });
  const other = { kind: "face", depth: 0.5, layer: 0, bbox: { min: [0, 5, 0], max: [1, 6, 0] }, rect: [500, 500, 510, 510], name: "other" };
  const names = sortFragments([piece(0, 0), other, piece(1, 1), piece(2, 2)]).map(f => f.name).join(" ");
  assert.match(names, /p0 p1 p2/);
});

test("build: a ring around a box is split, back half under the box and front half over it", () => {
  const { fragments } = build({ items: [
    { type: "box", size: [2, 2, 2], material: "solid" },
    { type: "ring", outline: [[2, -2], [2, 2], [-2, 2], [-2, -2]], at: [0, 0, 1] },
  ] });
  const overlap = (a, b) => a.rect[0] < b.rect[2] && b.rect[0] < a.rect[2] && a.rect[1] < b.rect[3] && b.rect[1] < a.rect[3];
  const faces = fragments.filter(f => f.kind === "face");
  const pieces = fragments.filter(f => f.kind === "line" && f.pts[0][2] === 1 && f.pts[1][2] === 1);
  let under = 0;
  let over = 0;
  for (const piece of pieces) for (const face of faces) {
    if (!overlap(piece, face)) continue;
    const rel = behind(piece, face);
    if (rel === 1) { under++; assert.ok(fragments.indexOf(piece) < fragments.indexOf(face), "a back piece is drawn over the box"); }
    if (rel === -1) { over++; assert.ok(fragments.indexOf(piece) > fragments.indexOf(face), "a front piece is drawn under the box"); }
  }
  assert.ok(under > 0 && over > 0, `under ${under}, over ${over}`);
});

test("build: a box shows exactly its top, +x and +y faces", () => {
  const { fragments } = build({ items: [{ type: "box", size: [1, 1, 1], material: "solid" }] });
  const faces = fragments.filter(f => f.kind === "face");
  assert.equal(faces.length, 3);
  const key = f => { const b = f.bbox; return b.min[2] === b.max[2] ? "top" : b.min[0] === b.max[0] ? "x" + b.min[0] : "y" + b.min[1]; };
  assert.deepEqual(faces.map(key).sort(), ["top", "x0.5", "y0.5"]);
});

test("build: fit keeps the content inside the frame and honours alignment", () => {
  const spec = { width: 400, height: 300, padding: 20, items: [{ type: "box", size: [2, 2, 3], material: "wire" }] };
  for (const align of ["center", "bottom", "top"]) {
    const { fragments } = build({ ...spec, align });
    const pts = fragments.flatMap(f => f.screen);
    const xs = pts.map(p => p[0]);
    const ys = pts.map(p => p[1]);
    assert.ok(Math.min(...xs) >= 20 - 1e-6 && Math.max(...xs) <= 380 + 1e-6);
    assert.ok(Math.min(...ys) >= 20 - 1e-6 && Math.max(...ys) <= 280 + 1e-6);
    if (align === "bottom") close(Math.max(...ys), 280, 1e-6);
    if (align === "top") close(Math.min(...ys), 20, 1e-6);
  }
});

test("build: composites expand to the right number of solids", () => {
  const count = items => new Set(build({ items }).fragments.filter(f => f.kind === "face").map(f => f.owner)).size;
  const item = { type: "box", size: [1, 1, 1], material: "solid" };
  assert.equal(count([{ type: "stack", count: 4, item }]), 4);
  assert.equal(count([{ type: "array", count: [3, 2], item }]), 6);
  assert.equal(count([{ type: "array", count: [3, 2], skip: [0], item }]), 5);
  assert.equal(count([{ type: "orbit", count: 5, ring: false, item }]), 5);
  assert.equal(count([{ type: "steps", count: 3, item }]), 3);
  assert.equal(count([{ type: "group", at: [1, 1, 0], items: [item, { ...item, at: [2, 0, 0] }] }]), 2);
  assert.throws(() => build({ items: [{ type: "teapot" }] }), /unknown item type/);
});

test("render: every example scene is clean, deterministic SVG in all three themes", () => {
  for (const [name, scene] of Object.entries(scenes)) {
    for (const theme of ["dark", "light", "lime"]) {
      const svg = render({ ...scene, theme });
      assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>"), name);
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/, `${name} (${theme})`);
      assert.equal((svg.match(/<linearGradient|<radialGradient/g) ?? []).length, (svg.match(/<\/linearGradient>|<\/radialGradient>/g) ?? []).length, name);
      for (const ref of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(svg.includes(`id="${ref[1]}"`), `${name}: missing gradient ${ref[1]}`);
      assert.equal(svg, render({ ...scene, theme }), `${name} is not deterministic`);
      assert.ok(svg.length < 64000, `${name} is ${svg.length} bytes`);
    }
    assert.match(render(scene), /prefers-reduced-motion:no-preference/);
    assert.match(render(scene), /role="img" aria-label="/);
  }
});

test("render: the lit part uses the accent, and only when asked", () => {
  const plain = render({ items: [{ type: "box", size: [1, 1, 1], material: "panel" }] });
  const lit = render({ items: [{ type: "box", size: [1, 1, 1], material: "panel", accent: true }] });
  assert.doesNotMatch(plain, /stroke="var\(--iso-accent\)"/);
  assert.match(lit, /stroke="var\(--iso-accent\)"/);
  assert.match(lit, /<ellipse/);                                   // the glow under it
  assert.match(render({ items: [], theme: "lime" }), /--iso-hot,#000000/);
});
