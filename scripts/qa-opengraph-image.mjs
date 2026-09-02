import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pngPath = "src/app/opengraph-image.png";
const altPath = "src/app/opengraph-image.alt.txt";
const legacyGeneratorPath = "src/app/opengraph-image.tsx";

test("the official social card is one static 1200x630 PNG with accessible metadata", async () => {
  const png = await readFile(pngPath);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  assert.deepEqual(png.subarray(0, 8), signature);
  assert.equal(png.toString("ascii", 12, 16), "IHDR");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.byteLength <= 5 * 1024 * 1024, "social card must stay within the strict Twitter image limit");

  const alt = (await readFile(altPath, "utf8")).trim();
  assert.equal(alt, "Lili Reflexología Holística — bienestar desde la base");

  await assert.rejects(access(legacyGeneratorPath), (error) => error?.code === "ENOENT");
});
