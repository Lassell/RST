import { ConfigEnv, defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import {
  NaiveUiResolver,
  ElementPlusResolver,
} from "unplugin-vue-components/resolvers";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig((configEnv: ConfigEnv) => {
  const srcPath = path.resolve(process.cwd(), "src");
  const viteEnv = loadEnv(configEnv.mode, process.cwd());
  const isDevelopment = configEnv.mode === "development";
  const plugins = [
    vue(),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        {
          pinia: ["defineStore"],
          "@/api/interceptor": ["post", "post"],
        },
      ],
      eslintrc: {
        enabled: true, // 默认为false，AutoImport改变时需设置true自动生成.eslintrc-auto-import.json解决eslint未申明便引入的报错问题
      },
      dts: "types/auto-imports.d.ts",
    }),
    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ["vue", "md"],
      // allow auto import and register components used in markdown
      // include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [NaiveUiResolver(), ElementPlusResolver()],
      dts: "types/components.d.ts",
    }),
  ];

  return {
    base: isDevelopment ? "" : "./",
    plugins,
    server: {
      host: "0.0.0.0",
      port: 6300,
    },
    resolve: {
      alias: {
        "@": srcPath,
      },
    },
    build: {
      reportCompressedSize: !isDevelopment,
      sourcemap: false,
      cssCodeSplit: false,
      minify: true,
      chunkSizeWarningLimit: 1024, // chunk 大小警告的限制（单位kb）
    },
  };
});
