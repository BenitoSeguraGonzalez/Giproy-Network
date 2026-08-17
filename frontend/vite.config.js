import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return
          }

          if (id.includes("react-router-dom")) {
            return "router"
          }

          if (
            id.includes("react-dom") ||
            id.includes("\\react\\") ||
            id.includes("/react/")
          ) {
            return "react-vendor"
          }

          if (id.includes("framer-motion") || id.includes("@react-spring")) {
            return "motion"
          }

          if (id.includes("leaflet") || id.includes("react-leaflet")) {
            return "maps"
          }

          if (
            id.includes("three") ||
            id.includes("web-ifc") ||
            id.includes("@thatopen")
          ) {
            return "bim-3d"
          }

          if (id.includes("@radix-ui")) {
            return "radix"
          }
        },
      },
    },
  },

  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },

  server: {
    port: 3010,
    strictPort: true,
    host: true,

    // Contrato local del tunel Cloudflare: giproy-network.excompc.dpdns.org -> localhost:3010.
    allowedHosts: [
      "giproy-network.excompc.dpdns.org",
      "nuria.excompc.dpdns.org",
      "api.excompc.dpdns.org",
      ".excompc.dpdns.org"
    ],

    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
