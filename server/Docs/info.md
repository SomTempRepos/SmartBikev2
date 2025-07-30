Key Files Explanation:
server.js (Entry Point - ~20 lines)

Import app.js
Start HTTP server
Handle graceful shutdown
Socket.IO server creation

src/app.js (Express App Setup - ~50 lines)

Express app configuration
Middleware registration (CORS, error handling, logging)
Route mounting
Export app for testing

src/config/environment.js (Environment Management)

Load and validate environment variables
Provide defaults for missing values
Export configuration object

src/utils/fileManager.js (File Operations)

Centralized JSON file read/write functions
Error handling for file operations
Directory creation utilities
Replace repeated fs.readJson/fs.writeJson calls

src/middleware/auth.js (Authentication)

Your existing authenticateJWT function
Token validation
User context attachment

src/services/socketService.js (WebSocket Management)

Socket.IO connection handling
Real-time data broadcasting
Client connection tracking
Event emitting (bikeData, geofenceAlert, etc.)

Migration Order with File Count:

Foundation (8 files): Config, utils, middleware, app.js
Authentication (3 files): authService.js, authController.js, authRoutes.js
Bike Service (3 files): bikeService.js, bikeController.js, bikeRoutes.js
Guardian/Ward (4 files): guardianService.js, wardController.js, routes
Geofencing (3 files): Move existing service, create controller/routes
Socket Service (2 files): Extract WebSocket logic
Integration (2 files): Update server.js, create main routes