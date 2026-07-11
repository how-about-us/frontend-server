import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const TARGETS = [
  "public/landing/01-hero-app.png",
  "public/landing/02-feature-map.png",
  "public/landing/03-feature-place-share.png",
  "public/landing/04-feature-plan.png",
];
const EXPECTED_SIZE = { width: 2920, height: 1934 };
const DOMAIN_PATCH = { left: 1288, top: 96, width: 344, height: 64 };

function pixelOffset(info, x, y) {
  return (y * info.width + x) * info.channels;
}

function assertOutsidePatchIsIdentical(original, edited, info) {
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const insidePatch =
        x >= DOMAIN_PATCH.left &&
        x < DOMAIN_PATCH.left + DOMAIN_PATCH.width &&
        y >= DOMAIN_PATCH.top &&
        y < DOMAIN_PATCH.top + DOMAIN_PATCH.height;
      if (insidePatch) continue;

      const offset = pixelOffset(info, x, y);
      for (let channel = 0; channel < info.channels; channel += 1) {
        if (original[offset + channel] !== edited[offset + channel]) {
          throw new Error(`Unexpected pixel change outside URL patch at ${x},${y}`);
        }
      }
    }
  }
}

// SVG 텍스트는 시스템 폰트 대체에 의존하므로, 커밋된 PNG를 만든 환경에서만 재실행해야 결과가 동일하다.
function createOverlay(background) {
  const fill = `rgb(${background[0]},${background[1]},${background[2]})`;
  return Buffer.from(`
    <svg width="${DOMAIN_PATCH.width}" height="${DOMAIN_PATCH.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${fill}" />
      <text x="50%" y="43" text-anchor="middle" fill="#f6f6f6"
        font-family="Arial, sans-serif" font-size="30" font-weight="600">uttae.app</text>
    </svg>
  `);
}

for (const relativePath of TARGETS) {
  const filePath = path.join(ROOT, relativePath);
  const input = await readFile(filePath);
  const { data: originalRaw, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== EXPECTED_SIZE.width || info.height !== EXPECTED_SIZE.height) {
    throw new Error(`${relativePath} has unexpected size ${info.width}x${info.height}`);
  }

  const sampleOffset = pixelOffset(info, DOMAIN_PATCH.left + 6, DOMAIN_PATCH.top + 6);
  const background = originalRaw.subarray(sampleOffset, sampleOffset + 3);
  const output = await sharp(input)
    .composite([
      {
        input: createOverlay(background),
        left: DOMAIN_PATCH.left,
        top: DOMAIN_PATCH.top,
        blend: "over",
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const { data: editedRaw, info: editedInfo } = await sharp(output)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (
    editedInfo.width !== info.width ||
    editedInfo.height !== info.height ||
    editedInfo.channels !== info.channels
  ) {
    throw new Error(`${relativePath} changed raw image dimensions or channels`);
  }
  assertOutsidePatchIsIdentical(originalRaw, editedRaw, info);

  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, output);
  await rename(temporaryPath, filePath);
  console.log(`updated ${relativePath}`);
}
