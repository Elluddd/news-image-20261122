// Entry program for the news-image-20261122 bounty.
// Writes the entry image (entry.png, sitting next to this script)
// into the output directory the platform provides.
//
// Node 22, standard library only. No network, no dependencies.
// The image itself is fully self-contained: this program only
// validates it and copies the exact bytes through.

const fs = require("node:fs");
const path = require("node:path");

const MAX_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message) {
  console.error(`entry error: ${message}`);
  process.exit(1);
}

// Read width and height from the PNG IHDR chunk. Layout of the first
// 33 bytes: 8 magic, 4 length, 4 "IHDR", then 4 width and 4 height,
// both big-endian. Returns { width, height }.
function readDimensions(bytes) {
  if (bytes.length < 33) {
    fail("entry.png is too short to hold a PNG header");
  }
  if (bytes.toString("latin1", 12, 16) !== "IHDR") {
    fail("entry.png has no IHDR chunk where one is expected");
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function main() {
  const scriptDir = __dirname;
  const source = path.join(scriptDir, "entry.png");
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  const target = path.join(outDir, "entry.png");

  let bytes;
  try {
    bytes = fs.readFileSync(source);
  } catch (err) {
    fail(`cannot read entry.png next to this script: ${err.message}`);
  }

  if (!bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    fail("entry.png is not a PNG file (bad magic bytes)");
  }

  if (bytes.length > MAX_BYTES) {
    fail(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
  }

  const { width, height } = readDimensions(bytes);
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    fail(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
  }
  console.log(`entry.png is ${width}x${height}, within limits`);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(target, bytes);
  console.log(`wrote ${target} (${bytes.length} bytes)`);
}

main();
