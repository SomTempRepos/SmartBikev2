const { Server } = require('socket.io');
const env = require('./environment');

// CORS options for Socket.IO
const getCorsOptions = () => {
  return {
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST'],
    credentials: true
  };
};

// Socket.IO configuration
const getSocketConfig = () => {
  return {
    cors: getCorsOptions(),
    transports: ['websocket'],
    pingTimeout: env.SOCKET_PING_TIMEOUT,
    pingInterval: env.SOCKET_PING_INTERVAL
  };
};

// Initialize Socket.IO server
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, getSocketConfig());
  
  console.log('🔌 Socket.IO server initialized with configuration:');
  console.log(`   CORS Origin: ${env.CORS_ORIGIN}`);
  console.log(`   Ping Timeout: ${env.SOCKET_PING_TIMEOUT}ms`);
  console.log(`   Ping Interval: ${env.SOCKET_PING_INTERVAL}ms`);
  
  return io;
};

module.exports = {
  getCorsOptions,
  getSocketConfig,
  initializeSocket
};