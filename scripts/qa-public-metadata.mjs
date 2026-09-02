import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import test from "node:test";

const officialOriginPattern = "https:\\/\\/lilireflex\\.capacero\\.ar";
const root = fileURLToPath(new URL("../", import.meta.url));
const nextBin = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);

async function reservePort() {
  const server = createServer();
  server.unref();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const { port } = address;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function waitForPage(url, child, logs) {
  const deadline = Date.now() + 25_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js exited before serving the page.\n${logs.join("")}`);
    }

    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Googlebot" },
      });
      if (response.ok) return response;
    } catch {
      // The server is still starting; retry until the bounded deadline.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for ${url}.\n${logs.join("")}`);
}

async function buildProduction(env) {
  const child = spawn(process.execPath, [nextBin, "build"], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString()));

  const [code, signal] = await once(child, "exit");
  assert.equal(
    signal,
    null,
    `Next.js production build was interrupted by ${signal}.\n${logs.join("")}`,
  );
  assert.equal(code, 0, `Next.js production build failed.\n${logs.join("")}`);
}

test(
  "the production build uses the official origin and stays crawlable without environment flags",
  { timeout: 90_000 },
  async () => {
    const port = await reservePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const env = { ...process.env };
    delete env.NEXT_PUBLIC_SITE_URL;
    delete env.PUBLICATION_STATUS;
    await buildProduction(env);

    const child = spawn(
      process.execPath,
      [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
      {
        cwd: root,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const logs = [];
    child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
    child.stderr.on("data", (chunk) => logs.push(chunk.toString()));

    try {
      const page = await waitForPage(`${baseUrl}/`, child, logs);
      const html = await page.text();
      const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
      assert.equal(robotsResponse.status, 200);
      const robots = await robotsResponse.text();

      assert.match(
        html,
        new RegExp(
          `<link(?=[^>]*rel="canonical")(?=[^>]*href="${officialOriginPattern}/?")[^>]*>`,
        ),
      );
      assert.match(
        html,
        new RegExp(
          `<meta(?=[^>]*property="og:image")(?=[^>]*content="${officialOriginPattern}/opengraph-image\\.png[^\"]*")[^>]*>`,
        ),
      );
      assert.match(
        html,
        new RegExp(
          `<meta(?=[^>]*name="twitter:image")(?=[^>]*content="${officialOriginPattern}/opengraph-image\\.png[^\"]*")[^>]*>`,
        ),
      );
      assert.match(
        html,
        /<meta(?=[^>]*name="robots")(?=[^>]*content="index, follow")[^>]*>/,
      );

      assert.match(robots, /^User-Agent: \*$/m);
      assert.match(robots, /^Allow: \/$/m);
      assert.doesNotMatch(robots, /^Disallow: \/$/m);
      assert.match(
        robots,
        /^Sitemap: https:\/\/lilireflex\.capacero\.ar\/sitemap\.xml$/m,
      );
    } finally {
      if (child.exitCode === null) {
        child.kill("SIGTERM");
        await once(child, "exit").catch(() => {});
      }
    }
  },
);
