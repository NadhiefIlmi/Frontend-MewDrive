import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: {},
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Naikkan warning limit — bundle kita memang besar karena TipTap + Radix
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // TipTap editor — hanya dimuat saat section Notes dibuka
          if (id.includes("@tiptap")) {
            return "vendor-tiptap";
          }
          // Recharts — hanya dimuat saat section Storage dibuka
          if (id.includes("recharts") || id.includes("d3-")) {
            return "vendor-recharts";
          }
          // Radix UI primitives — dipakai di banyak tempat, pisahkan dari React core
          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }
          // Lucide icons — besar, pisahkan agar cached terpisah
          if (id.includes("lucide-react")) {
            return "vendor-lucide";
          }
          // TanStack libraries
          if (id.includes("@tanstack")) {
            return "vendor-tanstack";
          }
          // React core
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }
          // Default: tidak di-chunk secara khusus (return undefined)
          return undefined;
        },
      },
    },
  },
  // Security headers untuk Vite dev server (membantu skor Lighthouse Best Practices)
  server: {
    headers: {
      // Mencegah clickjacking
      "X-Frame-Options": "SAMEORIGIN",
      // Paksa HTTPS saat sudah production (1 tahun)
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      // Isolasi cross-origin untuk mencegah Spectre attacks
      "Cross-Origin-Opener-Policy": "same-origin",
      // Mencegah MIME-type sniffing
      "X-Content-Type-Options": "nosniff",
    },
  },
});
