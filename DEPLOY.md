# 🚀 Deploy ZoomCuts AI v2 — Hostinger
## server1434 | Node.js 22.x | zoomcuts.app

---

## ✅ CHECKLIST RÁPIDO

- [ ] Banco MySQL criado no hPanel
- [ ] `.env` configurado com credenciais reais
- [ ] ZIP enviado via instalador automático ou FTP
- [ ] `npm install` + `npm run build` executados
- [ ] Pasta `logs/` criada
- [ ] App iniciado pelo hPanel ou PM2

---

## 1. BANCO DE DADOS

No **hPanel → Bancos de Dados → MySQL**:
- Banco já existe: `u400422084_zoomcuts`
- As tabelas são criadas **automaticamente** na primeira inicialização
- Para migrar manualmente: `node migrate_db.mjs`

---

## 2. CONFIGURAR .env

```bash
cp .env.example .env
nano .env   # preencher todos os valores
```

Variáveis obrigatórias:
```env
NODE_ENV=production
DB_HOST=193.203.175.82
DB_PORT=3306
DB_USER=u400422084_zoomcuts
DB_PASSWORD=SUA_SENHA_REAL
DB_NAME=u400422084_zoomcuts
JWT_SECRET=chave_aleatória_longa
GEMINI_API_KEY=sua_chave_gemini
APP_URL=https://zoomcuts.app
```

---

## 3. INSTALAR E BUILDAR

```bash
# No servidor via SSH
cd /home/u400422084/domains/zoomcuts.app/public_html

npm install
npm run build
```

O `npm run build` executa em sequência:
1. `vite build` → compila React para `dist/`
2. `tsx build-server.ts` → compila server.ts para `dist/server.cjs`

---

## 4. INICIAR

**Via hPanel → Node.js:**
- Entry point: `dist/server.cjs`
- Clicar em "Reiniciar"

**Via PM2:**
```bash
mkdir -p logs
npm install -g pm2
pm2 start ecosystem.config.cjs --env production
pm2 save && pm2 startup
```

---

## 5. VERIFICAR

```bash
curl https://zoomcuts.app/api/health
# {"status":"ok","env":"production","port":3000,...}
```

---

## 🔧 TROUBLESHOOTING

### Build falha: `Cannot find module 'tsx'`
```bash
npm install   # instala devDependencies também
```

### Banco não conecta
- Confirmar DB_PASSWORD no `.env`
- Testar: `mysql -h 193.203.175.82 -u u400422084_zoomcuts -p u400422084_zoomcuts`

### `dist/server.cjs` não encontrado após build
```bash
npm run clean && npm run build
```

### Verificar logs em tempo real
```bash
pm2 logs zoomcuts-ai
# ou
tail -f logs/app-error.log
```
