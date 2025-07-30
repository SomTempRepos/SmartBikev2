// server.js
require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { initializeSocket } = require('./src/config/socket');
const { PORT, HOST, NODE_ENV, MQTT_BROKER, JWT_SECRET, CORS_ORIGIN } = require('./src/config/environment');
//const { initializeDatabase } = require('./src/config/database');

(async () => {
  try {
    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = initializeSocket(server);

    // Start server
    server.listen(PORT, HOST, () => {
      console.log(`🚴 Smart-Cycle Server running at http://${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔐 JWT Secret: ${JWT_SECRET === 'supersecretkey' ? '⚠️ Default (change for production)' : '✅ Custom set'}`);
      console.log(`📡 MQTT Broker: ${MQTT_BROKER}`);
      console.log(`🌐 CORS Origin: ${CORS_ORIGIN}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
