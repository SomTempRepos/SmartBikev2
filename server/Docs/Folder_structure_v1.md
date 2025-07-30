smart-cycle-server/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bikeController.js
│   │   ├── guardianController.js
│   │   ├── geofenceController.js
│   │   └── historyController.js
│   │
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── bikeRoutes.js
│   │   ├── guardianRoutes.js
│   │   ├── geofenceRoutes.js
│   │   └── historyRoutes.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── bikeService.js
│   │   ├── guardianService.js
│   │   ├── geofencingService.js (your existing service)
│   │   └── socketService.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── cors.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   │
│   ├── utils/
│   │   ├── fileManager.js
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── logger.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── environment.js
│   │   └── socket.js
│   │
│   └── app.js
│
├── data/
│   ├── users.json
│   ├── bikes.json
│   ├── guardians.json
│   ├── ranks.json
│   └── daily/
│       └── (existing daily files)
│
├── tests/
│   ├── controllers/
│   ├── services/
│   └── routes/
│
├── docs/
│   ├── API.md
│   └── SETUP.md
│
├── scripts/
│   ├── setup.js
│   └── migrate.js
│
├── server.js (Entry point)
├── package.json
├── .env
├── .env.example
├── .gitignore
└── README.md



//Files - Phase -1
src/
├── config/
│   ├── environment.js
│   ├── database.js
│   └── socket.js
├── utils/
│   ├── fileManager.js
│   ├── constants.js
│   ├── helpers.js
│   └── logger.js
├── middleware/
│   ├── errorHandler.js
│   ├── cors.js
│   └── validation.js
└── app.js (basic Express app setup)

tests/
├── setup.js
├── helpers/
│   └── testUtils.js
└── controllers/
    └── (will add test files as we create controllers)

.env.example
package.json (updated with new dependencies)

File Responsibilities Breakdown
Controllers/ (Handle HTTP requests/responses)

authController.js - Login, signup, user management
bikeController.js - Bike data ingestion, bike CRUD operations
guardianController.js - Guardian profile, ward management
geofenceController.js - Geofence CRUD operations
historyController.js - Historical data retrieval

Routes/ (Define API endpoints)

index.js - Main router that combines all routes
authRoutes.js - /api/auth/* endpoints
bikeRoutes.js - /api/bikes/* endpoints
guardianRoutes.js - /api/guardian/* endpoints
geofenceRoutes.js - /api/geofence/* endpoints
historyRoutes.js - /api/history/* endpoints

Services/ (Business logic)

authService.js - JWT handling, password hashing
bikeService.js - Bike data processing, file operations
guardianService.js - Guardian/ward business logic
geofencingService.js - Your existing geofencing logic
socketService.js - WebSocket connection management

Middleware/ (Cross-cutting concerns)

auth.js - JWT authentication middleware
cors.js - CORS configuration
errorHandler.js - Global error handling
validation.js - Request validation

Utils/ (Helper functions)

fileManager.js - JSON file read/write operations
constants.js - Application constants
helpers.js - Common utility functions
logger.js - Logging configuration

Config/ (Configuration)

database.js - Data file paths and configurations
environment.js - Environment variables handling
socket.js - Socket.IO configuration