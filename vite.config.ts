import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { qwikReact } from "@builder.io/qwik-react/vite";
import wasm from "vite-plugin-wasm";
// import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig(() => {
  return {
    build: {
      rollupOptions: {
        output: {
          format: "es" as any
        }
      },
      target: 'esnext'
    },
    esbuild: {
      supported: {
        'top-level-await': true
      },
    },
    plugins: [
      qwikCity(),
      qwikVite(),
      tsconfigPaths(),
      qwikReact(),
      wasm(),
      // topLevelAwait(),
    ],
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
  };
});
