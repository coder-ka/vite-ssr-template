import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vr18sPlugin from "@coder-ka/vite-react18-ssr";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vr18sPlugin()],
});
