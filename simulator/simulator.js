// simulator.js - Updated ESP32 simulator with alert receiving capability
const axios = require('axios');
const express = require('express');
const http = require('http');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const SIMULATOR_PORT = process.env.SIMULATOR_PORT || 8080;
const INTERVAL_MS = process.env.INTERVAL_MS || 5000;

// Define bike with configurable movement pattern
const BIKE_CONFIG = {
  bikeId: 'BIKE001',
  baseLocation: { lat: 19.0760, lng: 72.8777 }, // Mumbai
  avgSpeedRange: [12, 28], // Realistic bicycle speeds in km/h
  movementPattern: 'random', // 'random', 'circular', 'linear'
  maxRadius: 0.01, // Maximum movement radius in degrees (roughly 1km)
  alertEndpoint: `http://localhost:${SIMULATOR_PORT}/alert`
};

console.log(`🚴 ESP32 Bike Simulator Configuration:`);
console.log(`  Server URL: ${SERVER_URL}`);
console.log(`  Simulator Port: ${SIMULATOR_PORT}`);
console.log(`  Data Interval: ${INTERVAL_MS}ms`);
console.log(`  Bike ID: ${BIKE_CONFIG.bikeId}`);
console.log(`  Alert Endpoint: ${BIKE_CONFIG.alertEndpoint}`);

// Simulation state
let battery = 70;
let sendCount = 0;
let lastBatteryUpdate = Date.now();
let currentPosition = { ...BIKE_CONFIG.baseLocation };
let movement = { lat: 0.0001, lng: 0.0001 }; // Movement increment
let alertCount = 0;

// Create Express app for receiving alerts
const app = express();
const server = http.createServer(app);

app.use(express.json());

// Alert endpoint - receives alerts from geo-fencing service
app.post('/alert', (req, res) => {
  try {
    const { bikeId, alert, timestamp } = req.body;
    
    alertCount++;
    
    console.log('\n🚨 ALERT RECEIVED from Geo-fencing Service:');
    console.log(`  Bike ID: ${bikeId}`);
    console.log(`  Status: ${alert.status.toUpperCase()}`);
    console.log(`  Message: ${alert.message}`);
    console.log(`  Distance: ${alert.distance} km`);
    console.log(`  Timestamp: ${alert.timestamp}`);
    console.log(`  Alert Count: ${alertCount}`);
    
    // Simulate ESP32 response based on alert
    if (alert.status === 'nok') {
      console.log('  🔴 ESP32 Action: BUZZER ON, LED RED');
      // In real ESP32: digitalWrite(BUZZER_PIN, HIGH); digitalWrite(LED_PIN, HIGH);
    } else {
      console.log('  🟢 ESP32 Action: BUZZER OFF, LED GREEN');
      // In real ESP32: digitalWrite(BUZZER_PIN, LOW); digitalWrite(LED_PIN, LOW);
    }
    
    res.json({
      success: true,
      message: 'Alert received by ESP32',
      bikeId,
      alertStatus: alert.status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error processing alert:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process alert',
      message: error.message
    });
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ESP32 Bike Simulator',
    bikeId: BIKE_CONFIG.bikeId,
    alertsReceived: alertCount,
    battery: battery,
    position: currentPosition,
    timestamp: new Date().toISOString()
  });
});

// Start alert server
server.listen(SIMULATOR_PORT, () => {
  console.log(`\n📡 ESP32 Alert Server started on port ${SIMULATOR_PORT}`);
  console.log(`🔗 Alert endpoint: http://localhost:${SIMULATOR_PORT}/alert`);
  console.log(`💚 Health check: http://localhost:${SIMULATOR_PORT}/health\n`);
});

// Movement patterns
function updatePosition() {
  switch (BIKE_CONFIG.movementPattern) {
    case 'circular':
      // Circular movement around base location
      const angle = (Date.now() / 10000) % (2 * Math.PI); // Complete circle every ~1 minute
      const radius = BIKE_CONFIG.maxRadius * 0.5;
      currentPosition.lat = BIKE_CONFIG.baseLocation.lat + Math.cos(angle) * radius;
      currentPosition.lng = BIKE_CONFIG.baseLocation.lng + Math.sin(angle) * radius;
      break;
      
    case 'linear':
      // Linear back and forth movement
      const progress = (Date.now() / 15000) % 2; // Back and forth every 30 seconds
      const factor = progress > 1 ? 2 - progress : progress;
      currentPosition.lat = BIKE_CONFIG.baseLocation.lat + (factor - 0.5) * BIKE_CONFIG.maxRadius;
      currentPosition.lng = BIKE_CONFIG.baseLocation.lng + (factor - 0.5) * BIKE_CONFIG.maxRadius * 0.5;
      break;
      
    case 'random':
    default:
      // Random walk with boundaries
      movement.lat += (Math.random() - 0.5) * 0.0002;
      movement.lng += (Math.random() - 0.5) * 0.0002;
      
      // Limit movement speed
      movement.lat = Math.max(-0.0005, Math.min(0.0005, movement.lat));
      movement.lng = Math.max(-0.0005, Math.min(0.0005, movement.lng));
      
      currentPosition.lat += movement.lat;
      currentPosition.lng += movement.lng;
      
      // Keep within bounds
      const latDiff = currentPosition.lat - BIKE_CONFIG.baseLocation.lat;
      const lngDiff = currentPosition.lng - BIKE_CONFIG.baseLocation.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      if (distance > BIKE_CONFIG.maxRadius) {
        // Pull back towards center
        const factor = BIKE_CONFIG.maxRadius / distance;
        currentPosition.lat = BIKE_CONFIG.baseLocation.lat + latDiff * factor;
        currentPosition.lng = BIKE_CONFIG.baseLocation.lng + lngDiff * factor;
        
        // Reverse movement direction
        movement.lat *= -0.5;
        movement.lng *= -0.5;
      }
      break;
  }
}

// Generate bike data
function generateBikeData() {
  updatePosition();
  
  const [minSpeed, maxSpeed] = BIKE_CONFIG.avgSpeedRange;
  const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
  
  return {
    avgSpeed: parseFloat(speed.toFixed(2)),
    location: {
      lat: parseFloat(currentPosition.lat.toFixed(6)),
      lng: parseFloat(currentPosition.lng.toFixed(6))
    },
    battery: battery
  };
}

// Send bike data to server
async function sendBikeData() {
  const payload = {
    bikeId: BIKE_CONFIG.bikeId,
    data: generateBikeData()
  };

  try {
    const response = await axios.post(`${SERVER_URL}/api/bike/data`, payload, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ESP32-Simulator/1.0'
      }
    });
    
    console.log(`[✓] ${BIKE_CONFIG.bikeId} - Status: ${response.status} | Battery: ${battery}% | Lat: ${payload.data.location.lat} | Lng: ${payload.data.location.lng}`);
    
  } catch (error) {
    console.error(`[❌] Error sending data for ${BIKE_CONFIG.bikeId}:`, error.message);
  }
}

// Battery management
function updateBattery() {
  sendCount++;

  // Battery decreases after every 5 sends or 30 seconds
  const now = Date.now();
  if (sendCount >= 5 || (now - lastBatteryUpdate) >= 30000) {
    battery--;
    sendCount = 0;
    lastBatteryUpdate = now;
    
    if (battery < 20) {
      battery = 70;
      console.log('🔋 Battery reset to 70%');
    }
  }
}

// Check server connectivity
async function checkServerHealth() {
  try {
    const response = await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
    console.log('✅ Server connectivity check passed');
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

// Main simulation loop
async function startDataTransmission() {
  console.log('🚀 Starting bike data transmission...');
  
  // Check server connectivity first
  const isServerHealthy = await checkServerHealth();
  if (!isServerHealthy) {
    console.log('⚠️  Server is not accessible. Data will still be sent but may fail.');
  }

  console.log('📡 Press Ctrl+C to stop the simulator\n');

  // Send initial data
  await sendBikeData();
  updateBattery();
  
  // Set up regular data transmission
  setInterval(async () => {
    await sendBikeData();
    updateBattery();
  }, INTERVAL_MS);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 ESP32 Bike Simulator stopped.');
  console.log(`📊 Final Stats:`);
  console.log(`  - Alerts received: ${alertCount}`);
  console.log(`  - Final battery: ${battery}%`);
  console.log(`  - Final position: ${currentPosition.lat}, ${currentPosition.lng}`);
  
  server.close(() => {
    console.log('✅ Alert server closed');
    process.exit(0);
  });
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Alert server error:', error.message);
});

// Start both services
console.log('🚴 ESP32 Bike Simulator with Alert Receiver');
console.log('=' .repeat(50));

startDataTransmission().catch(error => {
  console.error('❌ Failed to start data transmission:', error.message);
  process.exit(1);
});