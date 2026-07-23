module.exports = {
  apps: [{
    name: 'slack-emoji',
    script: 'server.js',
    cwd: '/home/ubuntu/app/slack-emoji',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '/home/ubuntu/app/slack-emoji/.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M'
  }]
};
