#!/usr/bin/env node
// Write an isometric scene to an SVG file.
//
//   node scripts/iso-render.mjs scene.json out.svg
//   node scripts/iso-render.mjs scene.mjs --theme light > out.svg
//   node scripts/iso-render.mjs --scene stack --theme lime out.svg
//
// A .json file holds one scene object. A .mjs or .js file default-exports a
// scene, or a function that returns one. --scene picks one of the examples in
// assets/js/iso-scenes.js, and --list prints their names.
// Flags override the scene: --theme dark|light|lime, --width, --height,
// --angle, --align center|bottom|top.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { render } from "../assets/js/iso.js";

const args = process.argv.slice(2);
const flags = {};
const rest = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--list") flags.list = true;
  else if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  else rest.push(args[i]);
}

async function load() {
  if (flags.scene || flags.list) {
    const { scenes } = await import("../assets/js/iso-scenes.js");
    if (flags.list) { console.log(Object.keys(scenes).join("\n")); process.exit(0); }
    if (!scenes[flags.scene]) throw new Error(`No example scene "${flags.scene}". Try --list.`);
    return scenes[flags.scene];
  }
  const file = rest.shift();
  if (!file) throw new Error("Usage: iso-render.mjs <scene.json|scene.mjs> [out.svg] [--theme dark|light|lime]");
  if (/\.json$/.test(file)) return JSON.parse(readFileSync(file, "utf8"));
  const mod = await import(pathToFileURL(resolve(file)).href);
  return typeof mod.default === "function" ? mod.default() : mod.default;
}

try {
  const scene = { ...(await load()) };
  if (flags.theme) scene.theme = flags.theme;
  if (flags.align) scene.align = flags.align;
  for (const key of ["width", "height", "angle"]) if (flags[key]) scene[key] = Number(flags[key]);
  const svg = render(scene);
  const out = rest[0];
  if (out) writeFileSync(out, svg + "\n"); else process.stdout.write(svg + "\n");
} catch (error) {
  console.error(String(error.message ?? error));
  process.exit(1);
}
