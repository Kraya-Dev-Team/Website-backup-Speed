#!/usr/bin/env node
/**
 * Kraya — luxury-grade image pipeline optimizer.
 *
 * Run once (or any time new heavy assets land):
 *   node scripts/optimize-images.mjs
 *
 * Idempotent: skips if the optimized output would be larger than the source,
 * or if the source is already smaller than `skipIfSmallerThan`.
 *
 * Quality target (luxury-grade, visually indistinguishable):
 *   - JPEG: mozjpeg quality 82
 *   - WebP: quality 85, effort 6, alphaQuality 95
 *
 * Why pre-optimize when Next.js's image optimizer already re-encodes?
 *   1. Cold-cache edge requests decode the source — a 9 MB JPEG takes ~400 ms;
 *      a 300 KB JPEG takes ~30 ms.
 *   2. Vercel deploy size drops dramatically.
 *   3. Source dimensions cap Next/image's max output; oversized sources waste
 *      RAM + CPU on every cache miss.
 */

import sharp from "sharp";
import { stat, unlink, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

/** @typedef {{
 *   src: string,
 *   out: string,
 *   format: "jpeg" | "webp",
 *   maxW: number,
 *   quality: number,
 *   skipIfSmallerThan?: number,
 *   deleteSourceAfter?: boolean,
 * }} AssetConfig */

/** @type {AssetConfig[]} */
const ASSETS = [
  // ─── SixSideCube faces (35.9 MB → ~1.8 MB) ────────────────────────────
  { src: "public/six/1.JPG", out: "public/six/1.JPG", format: "jpeg", maxW: 1800, quality: 82 },
  { src: "public/six/2.jpg", out: "public/six/2.jpg", format: "jpeg", maxW: 1800, quality: 82 },
  { src: "public/six/3.jpg", out: "public/six/3.jpg", format: "jpeg", maxW: 1800, quality: 82 },
  { src: "public/six/4.JPG", out: "public/six/4.JPG", format: "jpeg", maxW: 1800, quality: 82 },
  { src: "public/six/5.JPG", out: "public/six/5.JPG", format: "jpeg", maxW: 1800, quality: 82 },
  { src: "public/six/6.jpg", out: "public/six/6.jpg", format: "jpeg", maxW: 1800, quality: 82 },

  // ─── About page heavy JPG ─────────────────────────────────────────────
  { src: "public/about.jpg", out: "public/about.jpg", format: "jpeg", maxW: 2000, quality: 82 },

  // ─── Hero LCP — skip if already tiny ──────────────────────────────────
  {
    src: "public/home/hero/main.jpeg",
    out: "public/home/hero/main.jpeg",
    format: "jpeg",
    maxW: 2000,
    quality: 85,
    skipIfSmallerThan: 150_000,
  },

  // ─── ParallaxImageSection image (active, was wrongly flagged dead) ────
  {
    src: "public/home/iamge/dvdfb-2.jpg (1).jpeg",
    out: "public/home/iamge/dvdfb-2.jpg (1).jpeg",
    format: "jpeg",
    maxW: 2000,
    quality: 82,
  },

  // ─── PNG → WebP (alpha preserved) ─────────────────────────────────────
  {
    src: "public/ic_karma.png",
    out: "public/ic_karma.webp",
    format: "webp",
    maxW: 1200,
    quality: 85,
    deleteSourceAfter: true,
  },
  {
    src: "public/ic_moksha.png",
    out: "public/ic_moksha.webp",
    format: "webp",
    maxW: 1200,
    quality: 85,
    deleteSourceAfter: true,
  },
  {
    src: "public/home/hero/Frame_201.png",
    out: "public/home/hero/Frame_201.webp",
    format: "webp",
    maxW: 1920,
    quality: 85,
    deleteSourceAfter: true,
  },
  {
    src: "public/home/hero/Frame_202.png",
    out: "public/home/hero/Frame_202.webp",
    format: "webp",
    maxW: 1920,
    quality: 85,
    deleteSourceAfter: true,
  },
  {
    src: "public/about_craft.png",
    out: "public/about_craft.webp",
    format: "webp",
    maxW: 1200,
    quality: 85,
    deleteSourceAfter: true,
  },
  {
    src: "public/about_2.png",
    out: "public/about_2.webp",
    format: "webp",
    maxW: 1200,
    quality: 85,
    deleteSourceAfter: true,
  },
];

const fmtBytes = (n) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const pct = (before, after) =>
  before === 0 ? "0%" : `${(((before - after) / before) * 100).toFixed(1)}%`;

const results = [];
let totalBefore = 0;
let totalAfter = 0;

for (const asset of ASSETS) {
  const srcPath = join(REPO, asset.src);
  const outPath = join(REPO, asset.out);

  if (!existsSync(srcPath)) {
    results.push({ src: asset.src, status: "MISSING", before: 0, after: 0 });
    continue;
  }

  const srcStat = await stat(srcPath);
  totalBefore += srcStat.size;

  if (asset.skipIfSmallerThan && srcStat.size < asset.skipIfSmallerThan) {
    results.push({
      src: asset.src,
      status: `skipped (${fmtBytes(srcStat.size)} < threshold)`,
      before: srcStat.size,
      after: srcStat.size,
    });
    totalAfter += srcStat.size;
    continue;
  }

  const tempPath = `${outPath}.tmp`;

  let pipeline = sharp(srcPath).rotate(); // honor EXIF orientation
  const metadata = await sharp(srcPath).metadata();
  if (metadata.width && metadata.width > asset.maxW) {
    pipeline = pipeline.resize({ width: asset.maxW, withoutEnlargement: true });
  }

  if (asset.format === "jpeg") {
    pipeline = pipeline.jpeg({
      quality: asset.quality,
      mozjpeg: true,
      chromaSubsampling: "4:2:0",
      progressive: true,
    });
  } else if (asset.format === "webp") {
    pipeline = pipeline.webp({
      quality: asset.quality,
      alphaQuality: 95,
      effort: 6,
      smartSubsample: true,
    });
  }

  await pipeline.toFile(tempPath);
  const tempStat = await stat(tempPath);

  // Sanity: if output is larger than source AND we're writing in-place,
  // keep the original. (Sharp can sometimes inflate already-tiny files.)
  if (asset.src === asset.out && tempStat.size >= srcStat.size) {
    await unlink(tempPath);
    results.push({
      src: asset.src,
      status: `skipped (output ${fmtBytes(tempStat.size)} >= source)`,
      before: srcStat.size,
      after: srcStat.size,
    });
    totalAfter += srcStat.size;
    continue;
  }

  // For in-place replace: rename temp over src.
  // For format-change (src != out): write temp to out, optionally delete src.
  if (asset.src === asset.out) {
    await rename(tempPath, outPath);
  } else {
    await rename(tempPath, outPath);
    if (asset.deleteSourceAfter && existsSync(srcPath)) {
      await unlink(srcPath);
    }
  }

  totalAfter += tempStat.size;
  results.push({
    src: asset.src,
    out: asset.out,
    status: "ok",
    before: srcStat.size,
    after: tempStat.size,
  });
}

// ─── Report ─────────────────────────────────────────────────────────────
console.log("\nKraya — image optimization results\n");
console.log("".padEnd(90, "─"));
console.log(
  "Asset".padEnd(48) +
    "Before".padStart(12) +
    "After".padStart(12) +
    "Saved".padStart(10) +
    " Status",
);
console.log("".padEnd(90, "─"));

for (const r of results) {
  const label = r.out && r.out !== r.src ? `${r.src} → ${r.out}` : r.src;
  console.log(
    label.padEnd(48).slice(0, 48) +
      fmtBytes(r.before).padStart(12) +
      fmtBytes(r.after).padStart(12) +
      pct(r.before, r.after).padStart(10) +
      `  ${r.status}`,
  );
}

console.log("".padEnd(90, "─"));
console.log(
  "TOTAL".padEnd(48) +
    fmtBytes(totalBefore).padStart(12) +
    fmtBytes(totalAfter).padStart(12) +
    pct(totalBefore, totalAfter).padStart(10),
);
console.log("");
