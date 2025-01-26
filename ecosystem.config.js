module.exports = {
  apps: [{
    name: 'echelon',
    script: 'server/server.js',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 80
    }
  }]
}
