import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  await build({
    configFile: false,
    build: {
      target: 'esnext',
      lib: {
        entry: resolve(__dirname, 'src/ui/index.js'),
        name: 'DocMitraApp',
        formats: ['es'],
        fileName: () => 'app.js',
      },
      outDir: resolve(__dirname, 'app/assets/js'),
      emptyOutDir: false,
    },
  });

  // Mirror scoped tool stylesheets into app/assets/css for desktop release bundling
  const renameToolCss = resolve(__dirname, 'tools/rename_tool/rename_tool.css');
  const targetCss = resolve(__dirname, 'app/assets/css/rename_tool.css');
  if (fs.existsSync(renameToolCss)) {
    fs.copyFileSync(renameToolCss, targetCss);
  }

  console.log('[DocMitra] UI bundle built successfully -> app/assets/js/app.js');
}

run().catch((err) => {
  console.error('[DocMitra] UI build failed:', err);
  process.exit(1);
});
