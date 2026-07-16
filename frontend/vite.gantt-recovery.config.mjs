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
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  server: {
    port: 3110,
    strictPort: true,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3101",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
