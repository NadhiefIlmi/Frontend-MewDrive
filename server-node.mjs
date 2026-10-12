/**
 * Node.js adapter untuk TanStack Start / Nitro Web Fetch handler
 * Jalankan: node server-node.mjs
 */
import { createServer } from "node:http";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const CLIENT_DIR = join(__dirname, "dist/client");

// MIME types untuk static assets
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf":  "font/ttf",
  ".json": "application/json",
  ".txt":  "text/plain",
};

// Import server handler yang di-generate Nitro
const { default: handler } = await import("./dist/server/server.js");

async function serveStatic(req, res) {
  try {
    const urlPath = new URL(req.url, "http://localhost").pathname;
    const filePath = join(CLIENT_DIR, urlPath);

    // Security: pastikan path tidak keluar dari CLIENT_DIR
    if (!filePath.startsWith(CLIENT_DIR)) {
      return false;
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return false;

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": urlPath.startsWith("/assets/")
        ? "public, max-age=31536000, immutable" // assets di-hash, cache 1 tahun
        : "public, max-age=3600",
    });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  try {
    // Coba serve static file dulu
    const served = await serveStatic(req, res);
    if (served) return;

    // Kalau bukan static file, teruskan ke SSR handler
    const url = `http://${req.headers.host || "localhost"}${req.url}`;
    const method = req.method || "GET";

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    // Baca body untuk POST/PUT/PATCH
    let body = undefined;
    if (!["GET", "HEAD"].includes(method)) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }

    const request = new Request(url, { method, headers, body });

    // Panggil Nitro handler
    const response = await handler.fetch(request, {}, {});

    // Convert Web Response ke Node.js ServerResponse
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (err) {
    console.error("Server error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`MewDrive frontend running on http://localhost:${PORT}`);
});
