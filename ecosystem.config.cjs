// ecosystem.config.cjs — PM2 para Hostinger Node.js
// Uso: pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'zoomcuts-ai',
      script: './dist/server.cjs',
      cwd: '/home/u400422084/domains/zoomcuts.app/public_html',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      out_file:   './logs/app-out.log',
      error_file: './logs/app-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      kill_timeout:   10000,
      listen_timeout: 8000,
      restart_delay:  3000,
      min_uptime: '5s',
      max_restarts: 10
    }
  ]
};
