import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  console.log('[DocMitra] UI bundle built successfully -> app/assets/js/app.js');
}

run().catch((err) => {
  console.error('[DocMitra] UI build failed:', err);
  process.exit(1);
});
