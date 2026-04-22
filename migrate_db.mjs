/**
 * Script de migração manual do banco de dados.
 * Uso: node migrate_db.mjs
 * Requer o arquivo .env configurado na raiz do projeto.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function migrate() {
  const config = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'zoomcuts',
    connectTimeout: 10000
  };

  console.log(`🔌 Conectando em ${config.host}:${config.port}/${config.database}...`);
  const connection = await mysql.createConnection(config);
  console.log('✅ Conectado');

  const migrations = [
    {
      name: 'registration_ip',
      sql: `ALTER TABLE users ADD COLUMN registration_ip VARCHAR(45) AFTER name`
    },
    {
      name: 'registration_fingerprint',
      sql: `ALTER TABLE users ADD COLUMN registration_fingerprint VARCHAR(255) AFTER registration_ip`
    },
    {
      name: 'index_registration_ip',
      sql: `ALTER TABLE users ADD INDEX idx_registration_ip (registration_ip)`
    },
    {
      name: 'index_registration_fingerprint',
      sql: `ALTER TABLE users ADD INDEX idx_registration_fingerprint (registration_fingerprint)`
    }
  ];

  for (const m of migrations) {
    try {
      await connection.query(m.sql);
      console.log(`  ✅ ${m.name}`);
    } catch (_) {
      console.log(`  ⏭  ${m.name} — já existe, pulando`);
    }
  }

  console.log('🎉 Migração concluída!');
  await connection.end();
}

migrate().catch(err => {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
});
