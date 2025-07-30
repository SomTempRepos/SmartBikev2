// Load environment variables first
require('dotenv').config();

// Environment configuration with fallback defaults
const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3001,
  HOST: process.env.HOST || '0.0.0.0',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Socket.IO Configuration
  SOCKET_PING_TIMEOUT: parseInt(process.env.SOCKET_PING_TIMEOUT) || 30000,
  SOCKET_PING_INTERVAL: parseInt(process.env.SOCKET_PING_INTERVAL) || 5000,
  
  // MQTT Configuration
  MQTT_BROKER: process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com',
  
  // File Paths (will be handled by database.js)
  DATA_DIR: process.env.DATA_DIR,
  DAILY_DIR: process.env.DAILY_DIR,
  USERS_FILE: process.env.USERS_FILE,
  RANKS_FILE: process.env.RANKS_FILE,
  GUARDIANS_FILE: process.env.GUARDIANS_FILE,
  BIKES_FILE: process.env.BIKES_FILE
};

// Security warning for production
if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'supersecretkey') {
  console.warn('⚠️  WARNING: Using default JWT secret in production! Please set JWT_SECRET environment variable.');
}

// Validation helper
const validateConfig = () => {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

module.exports = {
  ...config,
  validateConfig,
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production'
};