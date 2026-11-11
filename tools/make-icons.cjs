const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

function roundRectCoverage(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - (hw - r);
  const dy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  const d = Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(dx, dy), 0) - r;
  return Math.min(1, Math.max(0, 0.5 - d));
}

const BLOCKS = [
  { x: 0.31, y: 0.31, c1: [255, 77, 109], c2: [255, 143, 171] },
  { x: 0.69, y: 0.31, c1: [255, 183, 3], c2: [255, 209, 102] },
  { x: 0.31, y: 0.69, c1: [6, 214, 160], c2: [63, 240, 190] },
  { x: 0.69, y: 0.69, c1: [123, 97, 255], c2: [178, 155, 255] }
];

function render(size) {
  const buf = Buffer.alloc(size * size * 4);
  const S = size;
  const radius = S * 0.22;
  const blockHalf = S * 0.185;
  const blockR = S * 0.062;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const i = (y * S + x) * 4;

      const bgc = roundRectCoverage(px, py, S / 2, S / 2, S / 2, S / 2, radius);
      const g = (px / S) * 0.45 + (py / S) * 0.55;
      let bg = mix([48, 14, 88], [12, 5, 30], g);
      let glow = 0;

      for (const b of BLOCKS) {
        const cx = b.x * S;
        const cy = b.y * S;
        const dist = Math.hypot(px - cx, py - cy) / (S * 0.42);
        const soft = Math.max(0, 1 - dist);
        glow = Math.max(glow, soft * soft * 0.5);
      }
      bg = [
        Math.min(255, bg[0] + glow * 150),
        Math.min(255, bg[1] + glow * 60),
        Math.min(255, bg[2] + glow * 190)
      ];

      let r = bg[0], gg = bg[1], bb = bg[2], a = bgc;

      for (const b of BLOCKS) {
        const cx = b.x * S;
        const cy = b.y * S;
        const cov = roundRectCoverage(px, py, cx, cy, blockHalf, blockHalf, blockR);
        if (cov > 0.001) {
          const t = Math.min(1, Math.max(0, ((px - (cx - blockHalf)) / (blockHalf * 2)) * 0.35 + ((py - (cy - blockHalf)) / (blockHalf * 2)) * 0.65));
          const col = mix(b.c1, b.c2, t);
          const shine = Math.max(0, 1 - Math.abs(py - (cy - blockHalf * 0.55)) / (blockHalf * 0.55)) * 0.35 * cov;
          const out = [Math.min(255, col[0] + shine * 255), Math.min(255, col[1] + shine * 255), Math.min(255, col[2] + shine * 255)];
          r = r + (out[0] - r) * cov;
          gg = gg + (out[1] - gg) * cov;
          bb = bb + (out[2] - bb) * cov;
        }
      }

      buf[i] = Math.round(Math.min(255, Math.max(0, r)));
      buf[i + 1] = Math.round(Math.min(255, Math.max(0, gg)));
      buf[i + 2] = Math.round(Math.min(255, Math.max(0, bb)));
      buf[i + 3] = Math.round(255 * Math.min(1, Math.max(0, a)));
    }
  }
  return encodePNG(S, S, buf);
}

const outDir = path.resolve(__dirname, "..", "block-blast-app", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const file = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(file, render(size));
  console.log("icon:", file);
}
