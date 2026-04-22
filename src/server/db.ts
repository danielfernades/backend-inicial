import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Garante que .env seja carregado mesmo quando chamado de dist/server.cjs
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'zoomcuts',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export async function initDb() {
  const connection = await pool.getConnection();
  try {
    // Tabela de usuários (com colunas de anti-fraude)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                        INT AUTO_INCREMENT PRIMARY KEY,
        email                     VARCHAR(255) UNIQUE NOT NULL,
        password_hash             VARCHAR(255) NOT NULL,
        name                      VARCHAR(255),
        stripe_customer_id        VARCHAR(255),
        subscription_status       VARCHAR(50) DEFAULT 'inactive',
        subscription_id           VARCHAR(255),
        exports_count             INT DEFAULT 0,
        uploads_count             INT DEFAULT 0,
        registration_ip           VARCHAR(45),
        registration_fingerprint  VARCHAR(255),
        created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_registration_ip (registration_ip),
        INDEX idx_registration_fingerprint (registration_fingerprint)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de projetos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        name       VARCHAR(255) NOT NULL,
        duration   VARCHAR(50) NOT NULL,
        status     VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migrações lazy: adiciona colunas se ainda não existirem
    const lazyMigrations = [
      `ALTER TABLE users ADD COLUMN registration_ip VARCHAR(45) AFTER name`,
      `ALTER TABLE users ADD COLUMN registration_fingerprint VARCHAR(255) AFTER registration_ip`,
    ];
    for (const sql of lazyMigrations) {
      try { await connection.query(sql); } catch (_) { /* coluna já existe — ok */ }
    }

    console.log('✅ Banco de dados inicializado');
  } finally {
    connection.release();
  }
}
