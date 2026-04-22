import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDb } from './src/server/db.js';
import { authRouter } from './src/server/auth.js';
import { stripeRouter } from './src/server/stripe.js';
import { projectsRouter } from './src/server/projects.js';

// ── Carregar .env ─────────────────────────────────────────────
// Tenta múltiplos locais: cwd(), um nível acima, e ao lado do executável.
// Isso garante que funciona tanto no build source quanto em public_html/
const envCandidates = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(process.cwd(), '..', '..', '.env'),
];
for (const p of envCandidates) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); break; }
}

// ── Resolver caminho dos arquivos estáticos ───────────────────
// Cenário A: rodando da raiz do projeto → serve dist/
// Cenário B: rodando de public_html/ (após Hostinger copiar dist/) → serve ./
function getStaticPath(): string {
  const distFromCwd = path.join(process.cwd(), 'dist');
  return fs.existsSync(path.join(distFromCwd, 'index.html'))
    ? distFromCwd
    : process.cwd();
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  await initDb().catch(err =>
    console.warn('⚠️  DB init falhou:', err.message)
  );

  app.set('trust proxy', true);
  app.use(cors({ origin: process.env.APP_URL || '*', credentials: true }));
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '50mb' }));

  app.use('/api/auth',     authRouter);
  app.use('/api/stripe',   stripeRouter);
  app.use('/api/projects', projectsRouter);

  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', env: process.env.NODE_ENV, port: PORT })
  );

  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const staticPath = getStaticPath();
    console.log(`📂 Servindo estáticos de: ${staticPath}`);
    app.use(express.static(staticPath));
    app.get('*', (_req, res) => {
      const idx = path.join(staticPath, 'index.html');
      if (fs.existsSync(idx)) res.sendFile(idx);
      else res.status(404).send('index.html não encontrado');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════╗
║   🎬  ZoomCuts AI v1.0.0             ║
╠══════════════════════════════════════╣
║  Porta: ${String(PORT).padEnd(28)}║
║  Modo:  ${(isProd ? 'production' : 'development').padEnd(28)}║
╚══════════════════════════════════════╝`);
  });
}

startServer().catch(err => { console.error(err); process.exit(1); });
