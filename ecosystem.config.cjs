const dotenv = require('dotenv');
const path = require('path');

// Parses the physical .env file created by your GitHub action
const envConfig = dotenv.config({ path: path.resolve(__dirname, '.env') }).parsed || {};

module.exports = {
  apps: [
    {
      name: 'herav',
      script: './.output/server/index.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      // The server doesn't exit on SIGINT (srvx only closes the HTTP
      // listener), so PM2 force-kills after kill_timeout. The 1.6s default
      // can cut off in-flight ballots and BullMQ SMS sends on every reload;
      // 10s lets them finish.
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: 5005,
        ...envConfig // 👈 This automatically grabs everything from your GitHub Secret
      }
    }
  ]
};
