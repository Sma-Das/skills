#!/usr/bin/env node
// Render a transition as a row of still frames, so its in-between shapes can be read without watching it.
//   node filmstrip.mjs menu cross > menu-cross.svg
//   node filmstrip.mjs play pause --frames 10 --icons ./my-icons.js --out play-pause.svg
// Open the SVG in a browser, or screenshot it, to inspect it as an image.
import { writeFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_SET, filmstrip, toSVG } from "../assets/js/icons.js";

const argv = process.argv.slice(2);
const arg = flag => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
const [from, to] = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
if (!from || !to) {
  console.error("usage: filmstrip.mjs <from> <to> [--frames 8] [--size 64] [--icons module.js] [--out file.svg]");
  process.exit(2);
}
let set = DEFAULT_SET;
if (arg("--icons")) {
  const mod = await import(pathToFileURL(resolvePath(arg("--icons"))).href);
  set = { icons: mod.ICONS ?? mod.default?.icons, groups: mod.GROUPS ?? mod.default?.groups ?? {} };
}
const count = Math.max(2, Number(arg("--frames") ?? 8));
const size = Number(arg("--size") ?? 64);
const picks = filmstrip(from, to, { count, ...set });
const gap = 16, label = 18, width = count * size + (count + 1) * gap, height = size + gap * 2 + label;
const cells = picks.map(({ frame, ms }, i) => {
  const x = gap + i * (size + gap);
  const inner = toSVG(frame, { size, strokeWidth: 1.5, color: "#111" }).replace("<svg ", `<svg x="${x}" y="${gap}" `);
  return `<rect x="${x}" y="${gap}" width="${size}" height="${size}" fill="none" stroke="#ddd"/>${inner}<text x="${x + size / 2}" y="${gap + size + 14}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="11" fill="#666">${ms}ms</text>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fff"/>${cells.join("")}</svg>\n`;
if (arg("--out")) writeFileSync(arg("--out"), svg);
else process.stdout.write(svg);
