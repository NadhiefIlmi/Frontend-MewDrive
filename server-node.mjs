/**
 * Node.js adapter untuk TanStack Start / Nitro Web Fetch handler
 * Jalankan: node server-node.mjs
 */
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Import server handler yang di-generate Nitro
const { default: handler } = await import("./dist/server/server.js");

const server = createServer(async (req, res) => {
  try {
    // Convert Node.js IncomingMessage ke Web Request
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
