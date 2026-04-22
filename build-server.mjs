// build-server.mjs — compila server.ts → dist/server.cjs (bundle completo, sem dependências externas)
// Executado com: node build-server.mjs (puro Node.js, sem tsx)
import * as esbuild from 'esbuild';

console.log('🔨 Compilando servidor...');

await esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,           // embutir TUDO dentro do .cjs
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/server.cjs',
  // Sem externals — tudo bundlado para rodar standalone em public_html/
  // mysql2 usa implementação pure-JS quando bundlado (sem native bindings)
  external: [],
  logLevel: 'error',      // suprimir warnings de native modules opcionais
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

console.log('✅ dist/server.cjs gerado (standalone)');
