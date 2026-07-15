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
      env: {
        NODE_ENV: 'production',
        PORT: 5005,
        ...envConfig // 👈 This automatically grabs everything from your GitHub Secret
      }
    }
  ]
};
