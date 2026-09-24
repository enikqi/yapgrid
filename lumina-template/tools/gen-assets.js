#!/usr/bin/env node
/**
 * Generates the placeholder artwork shipped with the template.
 *
 * These are original abstract compositions built from gradients and geometry —
 * no stock photography, so the template can be redistributed without any image
 * licensing to chase. Swap them for real imagery when you build a live site.
 *
 *   node tools/gen-assets.js
 */

"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "assets", "img");
fs.mkdirSync(OUT, { recursive: true });

/** Brand-adjacent duotones. Index 0 is always the warm accent. */
const PALETTES = [
  ["#ff4d2e", "#1b1b22"],
  ["#ff7a45", "#141420"],
  ["#e8503a", "#101018"],
  ["#ff9a3d", "#191922"],
  ["#d94f6a", "#121219"],
  ["#ff5c35", "#0f0f16"],
];

function shell(w, h, inner, id) {
  const [a, b] = PALETTES[id % PALETTES.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Abstract artwork">
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}" stop-opacity=".9"/>
      <stop offset="1" stop-color="${b}" stop-opacity="1"/>
    </linearGradient>
    <radialGradient id="r${id}" cx=".3" cy=".25" r=".8">
      <stop offset="0" stop-color="${a}" stop-opacity=".55"/>
      <stop offset="1" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${b}"/>
  <rect width="${w}" height="${h}" fill="url(#r${id})"/>
${inner}
</svg>
`;
}

/** Concentric arcs sweeping out of one corner. */
function arcs(w, h, id) {
  const [a] = PALETTES[id % PALETTES.length];
  let out = "";
  for (let i = 1; i <= 7; i++) {
    const r = (Math.min(w, h) / 7) * i * 1.15;
    out += `  <circle cx="${w * 0.22}" cy="${h * 0.9}" r="${r.toFixed(
      1
    )}" fill="none" stroke="${a}" stroke-opacity="${(0.42 - i * 0.045).toFixed(
      3
    )}" stroke-width="1.4"/>\n`;
  }
  out += `  <circle cx="${w * 0.72}" cy="${h * 0.3}" r="${(
    Math.min(w, h) * 0.13
  ).toFixed(1)}" fill="url(#g${id})"/>\n`;
  return out;
}

/** A soft grid with one highlighted cell. */
function grid(w, h, id) {
  const [a] = PALETTES[id % PALETTES.length];
  const cols = 7;
  const rows = 5;
  const cw = w / cols;
  const ch = h / rows;
  let out = "";
  for (let c = 1; c < cols; c++) {
    out += `  <line x1="${(c * cw).toFixed(1)}" y1="0" x2="${(c * cw).toFixed(
      1
    )}" y2="${h}" stroke="${a}" stroke-opacity=".12"/>\n`;
  }
  for (let r = 1; r < rows; r++) {
    out += `  <line x1="0" y1="${(r * ch).toFixed(1)}" x2="${w}" y2="${(
      r * ch
    ).toFixed(1)}" stroke="${a}" stroke-opacity=".12"/>\n`;
  }
  out += `  <rect x="${(cw * 2).toFixed(1)}" y="${(ch * 1).toFixed(
    1
  )}" width="${(cw * 3).toFixed(1)}" height="${(ch * 3).toFixed(
    1
  )}" rx="10" fill="url(#g${id})" opacity=".85"/>\n`;
  return out;
}

/** Stacked diagonal bars. */
function bars(w, h, id) {
  const [a] = PALETTES[id % PALETTES.length];
  let out = `  <g transform="rotate(-24 ${w / 2} ${h / 2})">\n`;
  for (let i = 0; i < 9; i++) {
    const y = (h / 9) * i - h * 0.15;
    out += `    <rect x="${-w * 0.2}" y="${y.toFixed(1)}" width="${(
      w * 1.4
    ).toFixed(1)}" height="${(h / 26).toFixed(1)}" rx="6" fill="${a}" opacity="${(
      0.5 -
      i * 0.045
    ).toFixed(3)}"/>\n`;
  }
  out += "  </g>\n";
  out += `  <circle cx="${w * 0.78}" cy="${h * 0.72}" r="${(
    Math.min(w, h) * 0.1
  ).toFixed(1)}" fill="url(#g${id})"/>\n`;
  return out;
}

/** An abstract portrait silhouette for team cards. */
function portrait(w, h, id) {
  const [a] = PALETTES[id % PALETTES.length];
  return `  <circle cx="${w / 2}" cy="${h * 0.34}" r="${(w * 0.19).toFixed(
    1
  )}" fill="url(#g${id})"/>
  <path d="M ${w * 0.16} ${h} C ${w * 0.16} ${h * 0.68}, ${w * 0.84} ${
    h * 0.68
  }, ${w * 0.84} ${h} Z" fill="url(#g${id})" opacity=".92"/>
  <circle cx="${w / 2}" cy="${h * 0.34}" r="${(w * 0.27).toFixed(
    1
  )}" fill="none" stroke="${a}" stroke-opacity=".22"/>
`;
}

const RECIPES = [arcs, grid, bars];

/* Portfolio thumbs — 4:3 */
for (let i = 1; i <= 8; i++) {
  const fn = RECIPES[(i - 1) % RECIPES.length];
  fs.writeFileSync(
    path.join(OUT, `work-${i}.svg`),
    shell(800, 600, fn(800, 600, i), i)
  );
}

/* Article thumbs — 16:10 */
for (let i = 1; i <= 6; i++) {
  const fn = RECIPES[i % RECIPES.length];
  fs.writeFileSync(
    path.join(OUT, `post-${i}.svg`),
    shell(800, 500, fn(800, 500, i + 2), i + 2)
  );
}

/* Team portraits — 3:4 */
for (let i = 1; i <= 8; i++) {
  fs.writeFileSync(
    path.join(OUT, `member-${i}.svg`),
    shell(600, 800, portrait(600, 800, i), i)
  );
}

/* Wide feature image — 16:9 */
fs.writeFileSync(
  path.join(OUT, "feature-1.svg"),
  shell(1280, 720, arcs(1280, 720, 1), 1)
);
fs.writeFileSync(
  path.join(OUT, "feature-2.svg"),
  shell(1280, 720, grid(1280, 720, 4), 4)
);

/* Favicon */
fs.writeFileSync(
  path.join(OUT, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#0a0a0c"/>
  <path d="M20 16v26h18" fill="none" stroke="#f4f4f1" stroke-width="7" stroke-linecap="square"/>
  <circle cx="45" cy="21" r="6" fill="#ff4d2e"/>
</svg>
`
);

const count = fs.readdirSync(OUT).length;
process.stdout.write(count + " assets written to assets/img/\n");
