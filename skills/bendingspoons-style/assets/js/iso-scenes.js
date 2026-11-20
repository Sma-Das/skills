// Example scenes for iso.js: one per composition pattern in
// references/isometric.md. Copy one and change the items.
//
//   import { scenes } from "./iso-scenes.js";
//   mount(el, scenes.stack);
//   mount(el, { ...scenes.stack, theme: "light" });

const card = { width: 652, height: 400, align: "bottom", padding: 0 };

export const scenes = {
  // Stacked exploded layers: the same slab repeated up the z axis, the top one lit.
  stack: {
    ...card, scale: 62, offset: [0, 36], label: "Four stacked plates, the top one lit",
    items: [
      { type: "rings", shape: "round", count: 4, size: 4.4, step: 1.3 },
      { type: "stack", count: 4, gap: 0.62, accent: 3, fade: 0.45, animate: true, spread: 0.1,
        item: { type: "slab", size: [3.4, 3.4, 0.1], radius: 0.7, material: "glass" } },
      { type: "rows", at: [0, 0, 2.26], size: [1.5, 1.4], rows: 4, opacity: 0.9, layer: 1 },
    ],
  },

  // Ascending steps: rows that rise toward the back, one lit.
  steps: {
    ...card, scale: 50, offset: [0, 4], label: "Five bars stepping up, the tallest lit",
    items: [
      { type: "grid", size: 11, step: 1.2, opacity: 0.2 },
      { type: "steps", count: 5, step: 1.2, heights: [2.9, 2.3, 1.7, 1.1, 0.5], accent: 0,
        item: { type: "box", size: [0.9, 0.9, 1], material: "panel" } },
      { type: "line", points: [[-2.4, 0, 3.5], [-1.2, 0, 2.9], [0, 0, 2.3], [1.2, 0, 1.7], [2.4, 0, 1.1]], dash: [3, 4], opacity: 0.5 },
      { type: "dot", at: [-2.4, 0, 3.5], accent: true },
    ],
  },

  // Connected nodes: a core solid with satellites on a ring.
  orbit: {
    ...card, align: "center", scale: 40, offset: [0, 34], label: "A core cube ringed by six smaller cubes",
    items: [
      { type: "ring", opacity: 0.35, layer: -1, outline: [[2.1, 0], [1.05, 1.82], [-1.05, 1.82], [-2.1, 0], [-1.05, -1.82], [1.05, -1.82]] },
      { type: "orbit", count: 6, radius: 3.6, turn: 30, lift: 0.65, accent: [1, 4], linkOpacity: 0.5,
        items: [
          { type: "box", size: [1.3, 1.3, 1.3], material: "wire", hidden: true },
          { type: "box", size: [1.3, 1.3, 1.3], material: "panel" },
          { type: "box", size: [1.3, 1.3, 1.3], material: "ghost" },
        ] },
      { type: "box", at: [0, 0, 0.1], size: [1.6, 1.6, 1.6], material: "panel", tone: "sage", animate: { type: "float", amp: 0.18 } },
      { type: "array", at: [0, 0, 1.71], count: [4, 4], step: 0.4, item: { type: "plate", size: [0.4, 0.4], tone: "sage", stroke: { opacity: 0.9 }, animate: { type: "float", amp: 0.18 } } },
    ],
  },

  // A single hero object under a dome, on a disc. A low camera flattens the ground.
  dome: {
    ...card, angle: 15, scale: 60, offset: [0, 44], label: "A sphere resting under a dome",
    items: [
      { type: "glow", at: [0, 0, 0], radius: 2.6, strength: 0.4, animate: { type: "pulse", low: 0.5 } },
      { type: "dome", radius: 2.75, material: "wire", tone: "sage", stroke: { opacity: 0.8 } },
      { type: "disc", radius: 2.75, material: "glass", stroke: { opacity: 0.95, width: 1.6 }, fill: { top: [0.02, 0.22] } },
      { type: "sphere", radius: 1.2, at: [0, 0, 0.2], material: "solid", animate: { type: "float", amp: 0.2 } },
    ],
  },

  // A chip with traces: one flat hero, many lines that leave the frame.
  chip: {
    ...card, scale: 56, align: "top", offset: [0, 44], label: "A square chip with traces running out from two edges",
    items: [
      ...[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].flatMap((v, i) => [
        { type: "line", points: [[v, 1.75, -0.2], [v, 1.75, -1.6 - (3 - Math.abs(i - 3)) * 0.34], [v, 9, -1.6 - (3 - Math.abs(i - 3)) * 0.34]], round: 0.35, opacity: 0.42, fade: "end", travel: true, delay: i * 0.7, layer: -1, fit: false },
        { type: "line", points: [[1.75, v, -0.2], [1.75, v, -1.6 - (3 - Math.abs(i - 3)) * 0.34], [9, v, -1.6 - (3 - Math.abs(i - 3)) * 0.34]], round: 0.35, opacity: 0.42, fade: "end", travel: true, delay: 0.35 + i * 0.7, layer: -1, fit: false },
      ]),
      { type: "plate", size: [3.7, 3.7], at: [0, 0, -0.2], material: "ghost", stroke: { opacity: 0.8 }, animate: "march" },
      { type: "slab", size: [3.5, 3.5, 0.3], material: "panel", accent: true, glow: false, stroke: { color: "sage", opacity: 1 }, fill: { top: [0.1, 0.5] } },
      { type: "plate", size: [3.1, 3.1], at: [0, 0, 0.3], material: "ghost", opacity: 0.6 },
      { type: "rows", at: [0, 0, 0.3], size: [1.3, 1.3], rows: 4, layer: 1 },
    ],
  },

  // A funnel: rings that shrink as they descend, with points falling in.
  funnel: {
    ...card, angle: 24, scale: 50, offset: [0, 20], label: "Rings narrowing downward into a lit base",
    items: [
      { type: "ring", radius: 4.6, at: [0, 0, 3.3], dash: [4, 5], opacity: 0.35, fit: false },
      { type: "ring", radius: 3.7, at: [0, 0, 2.4], opacity: 0.8 },
      { type: "ring", radius: 2.7, at: [0, 0, 1.5], tone: "sage", opacity: 0.8 },
      { type: "ring", radius: 1.9, at: [0, 0, 0.7], dash: [4, 5], opacity: 0.45 },
      ...[20, 110, 200, 290].map(t => ({ type: "line", tone: "sage", opacity: 0.5, points: [[4.6 * Math.cos((t * Math.PI) / 180), 4.6 * Math.sin((t * Math.PI) / 180), 3.3], [1.3 * Math.cos((t * Math.PI) / 180), 1.3 * Math.sin((t * Math.PI) / 180), 0]] })),
      { type: "disc", radius: 1.3, material: "glass", accent: true, glow: 0.2, fill: { color: "ink", top: [0.1, 0.36] } },
      ...[[2.4, -1, 3], [-1.6, 1.8, 2.7], [0.4, 0.9, 1.9], [-0.6, -1.5, 2.2], [1.2, 0.2, 1.1]].map((at, i) => ({ type: "ring", radius: 0.09, segments: 12, at, opacity: 0.7, animate: { type: "pulse", delay: i * 0.6, low: 0.15 } })),
    ],
  },

  // A cluster on a grid: many small solids in rows, one lit.
  seats: {
    ...card, scale: 46, offset: [0, 8], label: "Rows of seats rising toward the back, one lit",
    items: [
      { type: "grid", size: 12, step: 1, opacity: 0.16 },
      ...[0, 1, 2, 3].map(row => ({
        type: "array", at: [0, 2.1 - row * 1.4, 0], count: [6, 1], step: 1.05, accent: row === 1 ? 4 : undefined,
        item: { type: "box", size: [0.8, 0.8, 0.45 + row * 0.5], material: "panel" },
      })),
      { type: "drop", at: [1.575, 0.7, 2.4], to: 0.95, opacity: 0.55 },
      { type: "dot", at: [1.575, 0.7, 2.4], accent: true, animate: { type: "pulse", low: 0.3 } },
    ],
  },

  // A database: stacked cylinders with one lit band.
  database: {
    ...card, scale: 56, offset: [0, 26], label: "Three stacked cylinders on a ringed floor",
    items: [
      { type: "rings", shape: "circle", count: 3, size: 5.4, step: 1.2 },
      { type: "stack", count: 3, gap: 0.3, accent: 1, animate: true, spread: 0.06,
        item: { type: "cylinder", radius: 1.9, height: 0.9, material: "panel" } },
      { type: "drop", at: [3.3, -1.2, 3.1], opacity: 0.45 },
      { type: "dot", at: [3.3, -1.2, 3.1], accent: true },
    ],
  },

  // A city: a cluster of boxes on a grid, one tower lit.
  city: {
    ...card, scale: 42, offset: [0, 18], label: "A block of towers on a grid, one lit",
    items: [
      { type: "grid", size: 12, step: 1.5, opacity: 0.2 },
      { type: "array", count: [4, 4], step: 1.5, accent: 10, skip: [3, 12],
        heights: [1.2, 2.4, 0.8, 1.6, 3.2, 1, 2, 0.6, 1.4, 2.8, 3.6, 1.8, 0.9, 2.2, 1.3, 2.6],
        item: { type: "box", size: [1, 1, 1], material: "panel" } },
    ],
  },

  // A pipeline: stations joined by axis-aligned connectors with travelling pulses.
  pipeline: {
    ...card, align: "center", scale: 50, offset: [0, 24], label: "Four stations joined by connectors, the third lit",
    items: [
      { type: "grid", size: 14, step: 1, opacity: 0.12 },
      { type: "link", from: [-4.5, -0.6, 0.35], to: [-1.5, 0.9, 0.35], opacity: 0.55, travel: true },
      { type: "link", from: [-1.5, 0.9, 0.35], to: [1.5, -0.6, 0.35], opacity: 0.55, travel: true, delay: 1.2 },
      { type: "link", from: [1.5, -0.6, 0.35], to: [4.5, 0.9, 0.35], opacity: 0.55, travel: true, delay: 2.4, via: "yxz" },
      { type: "cylinder", at: [-4.5, -0.6, 0], radius: 0.8, height: 0.7, material: "panel" },
      { type: "box", at: [-1.5, 0.9, 0], size: [1.5, 1.5, 0.7], material: "panel" },
      { type: "box", at: [1.5, -0.6, 0], size: [1.5, 1.5, 1.3], material: "panel", accent: true },
      { type: "hex", at: [4.5, 0.9, 0], radius: 0.9, height: 0.7, material: "panel" },
    ],
  },

  // A pyramid of parts: a hero cone over a ring, for hierarchy or focus.
  beacon: {
    ...card, scale: 58, offset: [0, 24], label: "A pyramid above three widening rings",
    items: [
      { type: "rings", shape: "circle", count: 4, size: 3, step: 1.1 },
      { type: "pyramid", size: [2.2, 2.2], height: 2.4, at: [0, 0, 0.4], material: "panel", accent: true, animate: { type: "float", amp: 0.16 } },
      { type: "plate", size: [2.2, 2.2], at: [0, 0, 0], material: "ghost" },
      ...[[1.1, 1.1], [-1.1, 1.1], [1.1, -1.1], [-1.1, -1.1]].map(([x, y]) => ({ type: "line", points: [[x, y, 0], [x, y, 0.4]], dash: [2, 3], opacity: 0.4 })),
    ],
  },
};
